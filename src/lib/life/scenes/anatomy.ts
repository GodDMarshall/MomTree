import * as THREE from "three";
import { backdropMaterial, fullscreenQuad, glassMaterial, glow, motes, shared, tissueMaterial } from "../materials";
import { Rig, clamp01, disposeScene, frameForCaptions, lerp, rng, smooth, span, taperedTube, windowed, type Ctx, type Hud, type StoryScene } from "./common";

// Units: 1 = 1 cm. Proportions follow adult anatomy: uterus ~7.5 × 5 × 3 cm, tubes ~10 cm long,
// ovaries ~3 × 2 × 1.5 cm, follicles ~1.6–2 cm across when ready for collection. Schematic, front view.
//
// The scene has its own timeline, 0–100, which the story schedule maps onto the page:
//   0–30    the anatomy, with the small resting (antral) follicles counted at the start of a cycle
//   30–58   ovarian stimulation: several follicles grow over about 8–14 days, checked by ultrasound
//   58–64   the trigger injection, which completes the eggs' maturation
//   64–100  egg collection: an ultrasound-guided needle through the vaginal wall drains the follicles;
//           the fluid goes to the laboratory, where the eggs (about 0.1 mm) are found under a microscope

const TUBE_PATH = [
  [2.15, 2.55, 0],
  [3.4, 2.95, 0.05],
  [4.7, 3.25, 0.1],
  [6.0, 3.25, 0.2],
  [7.1, 2.75, 0.35],
  [7.55, 1.75, 0.5],
  [7.2, 0.95, 0.65],
  [6.55, 0.6, 0.8],
] as const;
const OVARY_CENTRE = new THREE.Vector3(5.4, 0.2, 0);
const OVARY_RADII = new THREE.Vector3(1.5, 0.9, 0.75);
const OVARY_STIM = new THREE.Vector3(2.25, 1.5, 1.25);
/** Where the needle enters: the vaginal wall beside the cervix (schematic). */
const ENTRY = new THREE.Vector3(1.9, -4.6, 1.1);

function ellipsoidPoint(dir: THREE.Vector3, radii: THREE.Vector3, centre: THREE.Vector3, lift = 1) {
  const d = dir.clone();
  const s = 1 / Math.sqrt((d.x / radii.x) ** 2 + (d.y / radii.y) ** 2 + (d.z / radii.z) ** 2);
  return d.multiplyScalar(s * lift).add(centre);
}

type Follicle = { dir: THREE.Vector3; r0: number; r1: number; delay: number; pos: THREE.Vector3; radius: number };

/** The three follicles drained on screen, in order, with their local timings. */
const PICKS = [
  { k: 0, reach: [66, 70], drain: [70, 73] },
  { k: 1, reach: [74, 76.5], drain: [76.5, 79.5] },
  { k: 2, reach: [80.5, 83], drain: [83, 86] },
] as const;

export class AnatomyScene implements StoryScene {
  id = "anatomy" as const;
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(32, 1, 0.05, 200);
  ready = true;

  private rig: Rig;
  private root = new THREE.Group();
  private tubeCurves: THREE.CatmullRomCurve3[] = [];
  private fimbriae: THREE.Group[] = [];
  private ovaryGroup = new THREE.Group();
  private ovary!: THREE.Mesh;
  private resting!: THREE.InstancedMesh;
  private restingDirs: { dir: THREE.Vector3; s: number }[] = [];
  private follicles: Follicle[] = [];
  private stim!: THREE.InstancedMesh;
  // The other ovary responds to stimulation too.
  private ovaryL!: THREE.Mesh;
  private restingL!: THREE.InstancedMesh;
  private restingDirsL: { dir: THREE.Vector3; s: number }[] = [];
  private folliclesL: Follicle[] = [];
  private stimL!: THREE.InstancedMesh;
  private stimMat: THREE.ShaderMaterial;
  private needle: THREE.Mesh;
  private needleTip = new THREE.Vector3();
  private egg: THREE.Mesh;
  private cumulus: THREE.Mesh;
  private stimGroupL!: THREE.Group;
  private trigger: THREE.Mesh;
  private eggPos = new THREE.Vector3();
  private m = new THREE.Matrix4();
  private q = new THREE.Quaternion();
  private up = new THREE.Vector3(0, 1, 0);

  constructor() {
    const s = this.scene;
    s.add(fullscreenQuad(backdropMaterial({ inner: "#3a1f66", outer: "#110a1f", glow: "#c9a6ee", center: [0.6, 0.48] })));
    s.add(this.root);
    const r = rng(7);

    // ------------------------------------------------------------------ uterus (lathe of a measured profile)
    const profile = new THREE.CatmullRomCurve3(
      [
        [0.02, -3.8], [0.85, -3.76], [1.08, -3.45], [1.14, -2.7], [1.2, -1.95], [1.58, -1.25], [2.08, -0.25],
        [2.42, 0.85], [2.55, 1.85], [2.42, 2.65], [2.02, 3.22], [1.32, 3.55], [0.5, 3.69], [0.02, 3.72],
      ].map(([x, y]) => new THREE.Vector3(x, y, 0)),
    );
    const lathe = new THREE.LatheGeometry(profile.getPoints(64).map((p) => new THREE.Vector2(p.x, p.y)), 72);
    lathe.scale(1, 1, 0.62);
    const uterus = new THREE.Mesh(lathe, tissueMaterial({ color: "#c97b86", deep: "#4e1f2b", rim: "#ffc3cb", opacity: 0.58, fibre: 1.1, echo: 0.42 }));
    uterus.renderOrder = 3;
    this.root.add(uterus);

    // Endometrial cavity: an inverted triangle tapering into the cervical canal, glowing through the wall.
    const cav = new THREE.Shape();
    cav.moveTo(-1.62, 2.45);
    cav.quadraticCurveTo(0, 2.72, 1.62, 2.45);
    cav.quadraticCurveTo(0.62, 0.55, 0.13, -1.85);
    cav.lineTo(0.07, -3.75);
    cav.lineTo(-0.07, -3.75);
    cav.lineTo(-0.13, -1.85);
    cav.quadraticCurveTo(-0.62, 0.55, -1.62, 2.45);
    const cavGeo = new THREE.ExtrudeGeometry(cav, { depth: 0.34, bevelEnabled: true, bevelThickness: 0.12, bevelSize: 0.1, bevelSegments: 3, curveSegments: 24 });
    cavGeo.translate(0, 0, -0.17);
    const endo = new THREE.Mesh(cavGeo, tissueMaterial({ color: "#f2a6b1", deep: "#a3465a", rim: "#ffe0e4", glow: 0.7, fibre: 2.4, echo: 0.8 }));
    endo.renderOrder = 1;
    this.root.add(endo);

    // ------------------------------------------------------------------ tubes, fimbriae, ovaries (both sides)
    const tubeMat = tissueMaterial({ color: "#d58c96", deep: "#5d2533", rim: "#ffcdd3", opacity: 0.92, fibre: 2.6, echo: 0.5 });
    const ovaryMat = tissueMaterial({ color: "#e4b8b0", deep: "#74404a", rim: "#ffe4dc", opacity: 0.96, fibre: 0.5, echo: 0.55 });
    const ligMat = tissueMaterial({ color: "#bf7f87", deep: "#4f2330", rim: "#f3b9c0", opacity: 0.75, echo: 0.45 });
    // Follicles are fluid-filled, so they show dark on ultrasound (echo near 0).
    const follicleMat = glassMaterial({ color: "#f8dccf", rim: "#fff2ea", opacity: 0.14, rimStrength: 0.95, echo: 0.04 });

    for (const side of [1, -1]) {
      const pts = TUBE_PATH.map(([x, y, z]) => new THREE.Vector3(x * side, y, z));
      const curve = new THREE.CatmullRomCurve3(pts, false, "centripetal");
      this.tubeCurves.push(curve);
      // Isthmus narrow, ampulla wider, infundibulum flaring at the end.
      const radius = (u: number) => 0.16 + 0.2 * THREE.MathUtils.smoothstep(u, 0.3, 0.6) + 0.22 * THREE.MathUtils.smoothstep(u, 0.86, 1);
      const tube = new THREE.Mesh(taperedTube(curve, 180, 14, radius), tubeMat);
      tube.renderOrder = 2;
      this.root.add(tube);

      // Fimbriae: finger-like fronds around the opening, reaching toward the ovary.
      const end = curve.getPointAt(1);
      const tan = curve.getTangentAt(1);
      const fr = new THREE.Group();
      fr.position.copy(end);
      const basisA = new THREE.Vector3().crossVectors(tan, new THREE.Vector3(0, 0, 1)).normalize();
      const basisB = new THREE.Vector3().crossVectors(tan, basisA).normalize();
      for (let k = 0; k < 11; k++) {
        const a = (k / 11) * Math.PI * 2 + r() * 0.3;
        const radial = basisA.clone().multiplyScalar(Math.cos(a)).add(basisB.clone().multiplyScalar(Math.sin(a)));
        const len = 0.55 + r() * 0.45;
        const c = new THREE.CatmullRomCurve3([
          radial.clone().multiplyScalar(0.42),
          tan.clone().multiplyScalar(len * 0.45).add(radial.clone().multiplyScalar(0.62)),
          tan.clone().multiplyScalar(len).add(radial.clone().multiplyScalar(0.78 + r() * 0.3)).add(new THREE.Vector3(0, -0.25, 0)),
        ]);
        fr.add(new THREE.Mesh(taperedTube(c, 24, 6, (u) => 0.075 * (1 - u * 0.75)), tubeMat));
      }
      this.fimbriae.push(fr);
      this.root.add(fr);

      // Ovary: an almond-shaped ellipsoid, with small resting (antral) follicles at its surface.
      const oc = OVARY_CENTRE.clone().setX(OVARY_CENTRE.x * side);
      const group = side === 1 ? this.ovaryGroup : new THREE.Group();
      group.position.copy(oc);
      group.rotation.z = -0.18 * side;
      const ovary = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 40), ovaryMat);
      ovary.scale.copy(OVARY_RADII);
      group.add(ovary);
      const fol = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 20, 14), follicleMat, 14);
      const m = new THREE.Matrix4();
      for (let k = 0; k < 14; k++) {
        const dir = new THREE.Vector3(r() - 0.5, r() - 0.5, r() * 0.9 - 0.15).normalize();
        const sc = 0.1 + r() * 0.14;
        (side === 1 ? this.restingDirs : this.restingDirsL).push({ dir, s: sc });
        m.compose(ellipsoidPoint(dir, OVARY_RADII, new THREE.Vector3(), 0.96), new THREE.Quaternion(), new THREE.Vector3(sc, sc, sc));
        fol.setMatrixAt(k, m);
      }
      fol.renderOrder = 4;
      group.add(fol);
      if (side === 1) {
        this.ovary = ovary;
        this.resting = fol;
      } else {
        this.ovaryL = ovary;
        this.restingL = fol;
        this.stimGroupL = group;
      }
      this.root.add(group);

      // Utero-ovarian ligament.
      const lig = new THREE.CatmullRomCurve3([
        new THREE.Vector3(2.0 * side, 1.55, -0.1),
        new THREE.Vector3(3.1 * side, 1.0, -0.15),
        new THREE.Vector3(4.05 * side, 0.45, -0.1),
      ]);
      this.root.add(new THREE.Mesh(taperedTube(lig, 30, 8, () => 0.13), ligMat));
    }

    // ------------------------------------------------------------------ stimulation: several follicles grow at once
    this.stimMat = glassMaterial({ color: "#fbe3d6", rim: "#fff6ee", opacity: 0.2, rimStrength: 1.0, rimPow: 2, echo: 0.03 });
    const dirs = [
      [0.35, -0.55, 0.78], [-0.25, -0.62, 0.72], [0.72, -0.1, 0.66], [-0.6, -0.1, 0.78], [0.1, 0.2, 0.98],
      [0.62, 0.48, 0.6], [-0.45, 0.52, 0.7], [0.05, -0.85, 0.5], [0.85, -0.45, 0.25],
    ];
    dirs.forEach(([x, y, z], i) => {
      this.follicles.push({ dir: new THREE.Vector3(x, y, z).normalize(), r0: 0.13 + r() * 0.08, r1: lerp(0.55, 0.82, r()) * (i < 3 ? 1.08 : 1), delay: r() * 6, pos: new THREE.Vector3(), radius: 0 });
    });
    this.stim = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 40, 28), this.stimMat, this.follicles.length);
    this.stim.renderOrder = 5;
    this.ovaryGroup.add(this.stim);
    // Mirror image on the other side (its group is mirrored by its own rotation and position).
    dirs.forEach(([x, y, z]) => {
      this.folliclesL.push({ dir: new THREE.Vector3(-x, y * 0.9, z).normalize(), r0: 0.13 + r() * 0.08, r1: lerp(0.5, 0.78, r()), delay: r() * 6, pos: new THREE.Vector3(), radius: 0 });
    });
    this.stimL = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 40, 28), this.stimMat, this.folliclesL.length);
    this.stimL.renderOrder = 5;
    this.stimGroupL.add(this.stimL);

    // The trigger: a soft pulse through the ovary as the eggs complete their maturation.
    this.trigger = glow("#e9d8ff", 2.6, 0.0);
    this.trigger.renderOrder = 8;
    this.ovaryGroup.add(this.trigger);

    // ------------------------------------------------------------------ egg collection
    const needleGeo = new THREE.CylinderGeometry(0.055, 0.055, 1, 12, 1, false);
    needleGeo.translate(0, 0.5, 0);
    this.needle = new THREE.Mesh(needleGeo, glassMaterial({ color: "#eef0f6", rim: "#ffffff", opacity: 0.85, rimStrength: 0.45, rimPow: 1.4, echo: 0.97 }));
    this.needle.renderOrder = 9;
    this.root.add(this.needle);

    // A drop of follicle fluid travelling down the needle (pale straw, as it is in life).
    this.cumulus = glow("#f3e3bb", 0.5, 0.0);
    this.egg = glow("#fbf2dc", 0.22, 0.12);
    this.cumulus.renderOrder = 10;
    this.egg.renderOrder = 11;
    this.root.add(this.cumulus, this.egg);

    this.scene.add(motes({ count: 160, box: [26, 16, 18], color: "#d9c8f2", size: 2.6, opacity: 0.45, center: [0, 1, -2] }));

    this.rig = new Rig([
      { u: 0, target: [0, 1.7, 0], pos: [0.4, 2.0, 5.2] },
      { u: 8, target: [0, 0.8, 0], pos: [1.6, 1.6, 17.5] },
      { u: 21, target: [0, 0.6, 0], pos: [-2.6, 2.3, 23] },
      { u: 30, target: [3.4, 0.4, 0], pos: [4.8, 1.8, 15.5] },
      { u: 38, target: [5.4, 0.25, 0.3], pos: [6.7, 1.4, 9.6] },
      { u: 56, target: [5.5, 0.15, 0.4], pos: [7.0, 0.9, 9.0] },
      { u: 64, target: [4.6, -1.2, 0.5], pos: [5.9, -1.4, 12.2] },
      { u: 90, target: [4.7, -1.1, 0.5], pos: [5.7, -1.2, 11.2] },
      { u: 100, target: [4.8, -1.0, 0.5], pos: [5.6, -1.0, 10.4] },
    ]);
  }

  async load() {}

  layout(ctx: Ctx) {
    this.scene.traverse((o) => {
      const m = (o as THREE.Points).material as THREE.ShaderMaterial | undefined;
      if (m?.uniforms?.uPixelRatio) m.uniforms.uPixelRatio.value = ctx.dpr;
    });
  }

  update(u: number, _dt: number, ctx: Ctx) {
    // Wide shots sit well right of the captions; close-ups come back toward the centre.
    frameForCaptions(this.camera, ctx, 0.19 - span(u, 26, 38) * 0.09);
    this.rig.apply(this.camera, u, ctx, 0.08);

    // Fimbriae sway gently, as they do in life.
    const t = performance.now() / 1000;
    this.fimbriae.forEach((f, i) => {
      f.rotation.set(Math.sin(t * 0.7 + i) * 0.06, Math.cos(t * 0.5 + i) * 0.05, Math.sin(t * 0.6 + i * 2) * 0.07);
    });

    // Stimulation: the ovary enlarges as several follicles grow, each at its own pace.
    const stim = span(u, 31, 57);
    const R = OVARY_RADII.clone().lerp(OVARY_STIM, stim);
    this.ovary.scale.copy(R);
    this.restingDirs.forEach(({ dir, s }, k) => {
      this.m.compose(ellipsoidPoint(dir, R, new THREE.Vector3(), 0.96), this.q.identity(), new THREE.Vector3().setScalar(s * (1 - stim * 0.6)));
      this.resting.setMatrixAt(k, this.m);
    });
    this.resting.instanceMatrix.needsUpdate = true;

    const drained = PICKS.map((p) => span(u, p.drain[0], p.drain[1]));
    this.follicles.forEach((f, k) => {
      const g = span(u, 31 + f.delay, 57);
      const pick = PICKS.findIndex((p) => p.k === k);
      const drain = pick >= 0 ? drained[pick] : 0;
      f.radius = lerp(f.r0, f.r1, g) * (1 - drain * 0.7);
      f.pos.copy(ellipsoidPoint(f.dir, R, new THREE.Vector3(), 0.88));
      this.m.compose(f.pos, this.q.identity(), new THREE.Vector3().setScalar(Math.max(0.001, f.radius)));
      this.stim.setMatrixAt(k, this.m);
    });
    this.stim.instanceMatrix.needsUpdate = true;
    this.stim.visible = u > 29;
    this.ovaryL.scale.copy(R);
    this.restingDirsL.forEach(({ dir, s }, k) => {
      this.m.compose(ellipsoidPoint(dir, R, new THREE.Vector3(), 0.96), this.q.identity(), new THREE.Vector3().setScalar(s * (1 - stim * 0.6)));
      this.restingL.setMatrixAt(k, this.m);
    });
    this.restingL.instanceMatrix.needsUpdate = true;
    this.folliclesL.forEach((f, k) => {
      f.radius = lerp(f.r0, f.r1, span(u, 31 + f.delay, 57));
      f.pos.copy(ellipsoidPoint(f.dir, R, new THREE.Vector3(), 0.88));
      this.m.compose(f.pos, this.q.identity(), new THREE.Vector3().setScalar(Math.max(0.001, f.radius)));
      this.stimL.setMatrixAt(k, this.m);
    });
    this.stimL.instanceMatrix.needsUpdate = true;
    this.stimL.visible = u > 29;
    this.stimMat.uniforms.uOpacity.value = 0.2 * smooth(29, 31, u);

    // Trigger: a slow pulse, then calm.
    const trig = windowed(u, 58, 64, 1.4);
    const tm = this.trigger.material as THREE.ShaderMaterial;
    tm.uniforms.uOpacity.value = trig * (0.55 + 0.25 * Math.sin(t * 2.2));
    this.stimMat.uniforms.uRimStrength.value = 1.0 + trig * 0.8;
    this.ovaryGroup.updateMatrixWorld();

    // Egg collection: the needle reaches each follicle, drains it, and the egg travels down the needle.
    let tip = ENTRY.clone();
    let eggA = 0;
    for (let i = 0; i < PICKS.length; i++) {
      const p = PICKS[i];
      const target = this.follicles[p.k].pos.clone().applyMatrix4(this.ovaryGroup.matrixWorld);
      const from = i === 0 ? ENTRY.clone().addScaledVector(target.clone().sub(ENTRY).normalize(), 0.2) : tip.clone();
      const reach = span(u, p.reach[0], p.reach[1]);
      if (u >= p.reach[0]) tip = from.clone().lerp(target, reach);
      const carry = span(u, p.drain[0] + 0.4, p.drain[1] + 1.4);
      if (u >= p.drain[0] + 0.4 && u < p.drain[1] + 1.4) {
        this.eggPos.copy(target).lerp(ENTRY, carry);
        eggA = Math.min(smooth(p.drain[0] + 0.4, p.drain[0] + 1.0, u), 1 - smooth(p.drain[1] + 0.9, p.drain[1] + 1.4, u));
      }
    }
    const withdraw = span(u, 87, 92);
    tip.lerp(ENTRY, withdraw);
    const shown = smooth(64.5, 66, u) * (1 - smooth(91, 92, u));
    const dir = tip.clone().sub(ENTRY);
    const len = Math.max(0.001, dir.length());
    this.needle.position.copy(ENTRY);
    this.needle.quaternion.setFromUnitVectors(this.up, dir.normalize());
    this.needle.scale.set(1, len, 1);
    this.needle.visible = shown > 0.01;
    (this.needle.material as THREE.ShaderMaterial).uniforms.uFade.value = shown;
    this.needleTip.copy(tip);

    this.egg.position.copy(this.eggPos);
    this.cumulus.position.copy(this.eggPos);
    (this.egg.material as THREE.ShaderMaterial).uniforms.uOpacity.value = eggA;
    (this.cumulus.material as THREE.ShaderMaterial).uniforms.uOpacity.value = eggA * 0.45;

    // Ultrasound: scans during monitoring, and the guidance view during collection (probe below).
    const w = ctx.width * ctx.dpr;
    const h = ctx.height * ctx.dpr;
    shared.uUS.value = Math.max(windowed(u, 44, 55, 1.2), windowed(u, 64.5, 91, 1.2));
    if (ctx.portrait) shared.uProbe.value.set(w * 0.5, h * 1.0, h * 0.86);
    else shared.uProbe.value.set(w * 0.6, h * 1.03, h * 1.0);
  }

  hud(u: number): Hud {
    const leftTube = this.tubeCurves[1].getPointAt(0.42);
    const ovaryTop = new THREE.Vector3(0.2, 1.1, 0.6).applyMatrix4(this.ovaryGroup.matrixWorld);
    const lead = this.follicles[0].pos.clone().applyMatrix4(this.ovaryGroup.matrixWorld);
    const closeUp = windowed(u, 34, 91);
    return {
      labels: [
        { id: "uterus", pos: new THREE.Vector3(0.4, -0.6, 1.55), a: windowed(u, 4, 21) },
        { id: "endometrium", pos: new THREE.Vector3(0.6, 1.6, 0.4), a: windowed(u, 4.6, 21) },
        { id: "tube", pos: leftTube.clone().add(new THREE.Vector3(0, 0.3, 0.2)), a: windowed(u, 5.2, 21) },
        { id: "ovary", pos: new THREE.Vector3(-5.6, -0.65, 0.55), a: windowed(u, 5.8, 21) },
        { id: "cervix", pos: new THREE.Vector3(0.9, -3.3, 0.6), a: windowed(u, 6.4, 21) },
        { id: "antral", pos: ovaryTop, a: windowed(u, 22, 31) },
        { id: "follicles", pos: lead.clone().add(new THREE.Vector3(0.4, 0.6, 0.4)), a: windowed(u, 36, 63) },
        { id: "needleR", pos: ENTRY.clone().lerp(this.needleTip, 0.45).add(new THREE.Vector3(0.3, 0, 0.4)), a: windowed(u, 67, 90) },
        { id: "eggC", pos: this.eggPos.clone().add(new THREE.Vector3(0.25, 0.1, 0)), a: windowed(u, 71, 74.5, 0.4) },
      ],
      scale: closeUp > 0.01
        ? { from: new THREE.Vector3(3.0, -2.6, 0.5), to: new THREE.Vector3(4.0, -2.6, 0.5), label: "1 cm", a: closeUp }
        : { from: new THREE.Vector3(-7.4, -3.6, 0), to: new THREE.Vector3(-5.4, -3.6, 0), label: "2 cm", a: windowed(u, 3, 21) },
    };
  }

  dispose() {
    disposeScene(this.scene);
  }
}
