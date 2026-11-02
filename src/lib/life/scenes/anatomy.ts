import * as THREE from "three";
import { backdropMaterial, fullscreenQuad, glassMaterial, glow, motes, tissueMaterial } from "../materials";
import { Rig, clamp01, disposeScene, frameForCaptions, rng, span, taperedTube, windowed, type Ctx, type Hud, type StoryScene } from "./common";

// Units: 1 = 1 cm. Proportions follow adult anatomy: uterus ~7.5 × 5 × 3 cm, tubes ~10 cm long,
// ovaries ~3 × 2 × 1.5 cm, a pre-ovulatory follicle ~2 cm. Schematic, front view.

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
const DOMINANT_DIR = new THREE.Vector3(0.55, 0.6, 0.58);

function ellipsoidPoint(dir: THREE.Vector3, radii: THREE.Vector3, centre: THREE.Vector3, lift = 1) {
  const d = dir.clone();
  const s = 1 / Math.sqrt((d.x / radii.x) ** 2 + (d.y / radii.y) ** 2 + (d.z / radii.z) ** 2);
  return d.multiplyScalar(s * lift).add(centre);
}

export class AnatomyScene implements StoryScene {
  id = "anatomy" as const;
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(32, 1, 0.05, 200);
  ready = true;

  private rig: Rig;
  private root = new THREE.Group();
  private tubeCurves: THREE.CatmullRomCurve3[] = [];
  private fimbriae: THREE.Group[] = [];
  private dominant: THREE.Mesh;
  private dominantPos: THREE.Vector3;
  private egg: THREE.Mesh;
  private cumulus: THREE.Mesh;
  private eggPos = new THREE.Vector3();
  private mats: THREE.ShaderMaterial[] = [];

  constructor() {
    const s = this.scene;
    s.add(fullscreenQuad(backdropMaterial({ inner: "#4f2733", outer: "#1d0e11", glow: "#e0a3b0", center: [0.6, 0.48] })));
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
    const uterusMat = tissueMaterial({ color: "#c97b86", deep: "#4e1f2b", rim: "#ffc3cb", opacity: 0.58, fibre: 1.1 });
    const uterus = new THREE.Mesh(lathe, uterusMat);
    uterus.renderOrder = 3;
    this.root.add(uterus);
    this.mats.push(uterusMat);

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
    const endoMat = tissueMaterial({ color: "#f2a6b1", deep: "#a3465a", rim: "#ffe0e4", glow: 0.7, fibre: 2.4 });
    const endo = new THREE.Mesh(cavGeo, endoMat);
    endo.renderOrder = 1;
    this.root.add(endo);
    this.mats.push(endoMat);

    // ------------------------------------------------------------------ tubes, fimbriae, ovaries (both sides)
    const tubeMat = tissueMaterial({ color: "#d58c96", deep: "#5d2533", rim: "#ffcdd3", opacity: 0.92, fibre: 2.6 });
    const ovaryMat = tissueMaterial({ color: "#e4b8b0", deep: "#74404a", rim: "#ffe4dc", opacity: 0.96, fibre: 0.5 });
    const ligMat = tissueMaterial({ color: "#bf7f87", deep: "#4f2330", rim: "#f3b9c0", opacity: 0.75 });
    const follicleMat = glassMaterial({ color: "#f8dccf", rim: "#fff2ea", opacity: 0.14, rimStrength: 0.95 });
    this.mats.push(tubeMat, ovaryMat, ligMat, follicleMat);

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
        const finger = new THREE.Mesh(taperedTube(c, 24, 6, (u) => 0.075 * (1 - u * 0.75)), tubeMat);
        fr.add(finger);
      }
      this.fimbriae.push(fr);
      this.root.add(fr);

      // Ovary: an almond-shaped ellipsoid, with resting (antral) follicles bulging at its surface.
      const oc = OVARY_CENTRE.clone().setX(OVARY_CENTRE.x * side);
      const ovary = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 40), ovaryMat);
      ovary.scale.copy(OVARY_RADII);
      ovary.position.copy(oc);
      ovary.rotation.z = -0.18 * side;
      this.root.add(ovary);

      const fol = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 20, 14), follicleMat, 16);
      const m = new THREE.Matrix4();
      for (let k = 0; k < 16; k++) {
        const dir = new THREE.Vector3(r() - 0.5, r() - 0.5, r() * 0.9 - 0.15).normalize();
        const p = ellipsoidPoint(dir, OVARY_RADII, new THREE.Vector3(), 0.96).applyEuler(ovary.rotation).add(oc);
        const sc = 0.1 + r() * 0.15;
        m.compose(p, new THREE.Quaternion(), new THREE.Vector3(sc, sc, sc));
        fol.setMatrixAt(k, m);
      }
      fol.renderOrder = 4;
      this.root.add(fol);

      // Utero-ovarian ligament.
      const lig = new THREE.CatmullRomCurve3([
        new THREE.Vector3(2.0 * side, 1.55, -0.1),
        new THREE.Vector3(3.1 * side, 1.0, -0.15),
        new THREE.Vector3(4.05 * side, 0.45, -0.1),
      ]);
      this.root.add(new THREE.Mesh(taperedTube(lig, 30, 8, () => 0.13), ligMat));
    }

    // ------------------------------------------------------------------ the dominant follicle and its egg (right ovary)
    this.dominantPos = ellipsoidPoint(DOMINANT_DIR, OVARY_RADII, new THREE.Vector3(), 0.93)
      .applyEuler(new THREE.Euler(0, 0, -0.18))
      .add(OVARY_CENTRE);
    const domMat = glassMaterial({ color: "#fbe3d6", rim: "#fff6ee", opacity: 0.2, rimStrength: 1.1, rimPow: 2 });
    this.mats.push(domMat);
    this.dominant = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 30), domMat);
    this.dominant.position.copy(this.dominantPos);
    this.dominant.renderOrder = 5;
    this.root.add(this.dominant);

    this.cumulus = glow("#f4c2ae", 0.9, 0.0);
    this.egg = glow("#fff4ec", 0.32, 0.18);
    this.cumulus.renderOrder = 6;
    this.egg.renderOrder = 7;
    this.root.add(this.cumulus, this.egg);

    const dust = motes({ count: 160, box: [26, 16, 18], color: "#e8b4a4", size: 2.6, opacity: 0.45, center: [0, 1, -2] });
    this.scene.add(dust);

    this.rig = new Rig([
      { u: 11, target: [0, 1.7, 0], pos: [0.4, 2.0, 5.2] },
      { u: 13.4, target: [0, 0.8, 0], pos: [1.6, 1.6, 17.5] },
      { u: 16.5, target: [0, 0.6, 0], pos: [-2.6, 2.3, 23] },
      { u: 19.4, target: [1.9, 0.7, 0], pos: [3.2, 2.0, 18] },
      { u: 21.6, target: [5.7, 0.7, 0.4], pos: [7.6, 1.9, 8.2] },
      { u: 23.4, target: [6.5, 0.8, 0.6], pos: [8.8, 2.1, 5.4] },
      { u: 25.0, target: [5.9, 3.15, 0.3], pos: [6.7, 3.5, 2.5] },
      { u: 26.2, target: [5.6, 3.22, 0.3], pos: [5.85, 3.28, 0.9] },
    ]);
  }

  async load() {}

  layout(ctx: Ctx) {
    frameForCaptions(this.camera, ctx);
    this.scene.traverse((o) => {
      const m = (o as THREE.Points).material as THREE.ShaderMaterial | undefined;
      if (m?.uniforms?.uPixelRatio) m.uniforms.uPixelRatio.value = ctx.dpr;
    });
  }

  update(u: number, _dt: number, ctx: Ctx) {
    // Wide shots sit well right of the captions; close-ups can come back toward the centre.
    frameForCaptions(this.camera, ctx, 0.19 - span(u, 19.4, 21.6) * 0.11);
    this.rig.apply(this.camera, u, ctx, 0.08);

    // Fimbriae sway gently, as they do in life.
    const t = performance.now() / 1000;
    this.fimbriae.forEach((f, i) => {
      f.rotation.set(Math.sin(t * 0.7 + i) * 0.06, Math.cos(t * 0.5 + i) * 0.05, Math.sin(t * 0.6 + i * 2) * 0.07);
    });

    // The dominant follicle matures (~1 cm → ~2 cm), then ruptures at ovulation.
    const grow = span(u, 16.5, 22.2);
    const rupture = span(u, 22.4, 23.0);
    const rad = (0.42 + grow * 0.6) * (1 - rupture * 0.55);
    this.dominant.scale.setScalar(rad);
    (this.dominant.material as THREE.ShaderMaterial).uniforms.uFade.value = 1 - rupture * 0.6;

    // The egg, in its cloud of cumulus cells: inside the follicle, released, swept into the tube.
    const curve = this.tubeCurves[0];
    const toFimbria = span(u, 22.6, 23.8);
    const alongTube = span(u, 23.8, 25.8);
    const surface = this.dominantPos.clone().add(DOMINANT_DIR.clone().normalize().multiplyScalar(rad * 0.55));
    const end = curve.getPointAt(1);
    if (u < 23.8) this.eggPos.lerpVectors(surface, end, toFimbria);
    else curve.getPointAt(1 - alongTube * 0.45, this.eggPos);
    this.egg.position.copy(this.eggPos);
    this.cumulus.position.copy(this.eggPos);
    const eggVis = clamp01((u - 19.5) / 1.2);
    (this.egg.material as THREE.ShaderMaterial).uniforms.uOpacity.value = eggVis;
    (this.cumulus.material as THREE.ShaderMaterial).uniforms.uOpacity.value = eggVis * (0.55 - alongTube * 0.3);
    (this.egg.material as THREE.ShaderMaterial).uniforms.uScale.value = 0.26 + alongTube * 0.05;
  }

  hud(u: number): Hud {
    const leftTube = this.tubeCurves[1].getPointAt(0.42);
    return {
      labels: [
        { id: "uterus", pos: new THREE.Vector3(0.4, -0.6, 1.55), a: windowed(u, 14.2, 19.6) },
        { id: "endometrium", pos: new THREE.Vector3(0.6, 1.6, 0.4), a: windowed(u, 14.6, 19.6) },
        { id: "tube", pos: leftTube.clone().add(new THREE.Vector3(0, 0.3, 0.2)), a: windowed(u, 15, 19.6) },
        { id: "ovary", pos: new THREE.Vector3(-5.6, -0.65, 0.55), a: windowed(u, 15.4, 19.6) },
        { id: "cervix", pos: new THREE.Vector3(0.9, -3.3, 0.6), a: windowed(u, 15.8, 19.6) },
        { id: "follicle", pos: this.dominant.position.clone().add(new THREE.Vector3(0.3, 0.75, 0.3)), a: windowed(u, 20, 22.6) },
        { id: "egg", pos: this.eggPos.clone(), a: windowed(u, 23, 25.5) },
      ],
      scale: { from: new THREE.Vector3(-7.4, -3.6, 0), to: new THREE.Vector3(-5.4, -3.6, 0), label: "2 cm", a: windowed(u, 13.6, 19.8) },
    };
  }

  dispose() {
    disposeScene(this.scene);
  }
}
