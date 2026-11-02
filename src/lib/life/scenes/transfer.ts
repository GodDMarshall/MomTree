import * as THREE from "three";
import { backdropMaterial, fullscreenQuad, glassMaterial, glow, motes, shared, tissueMaterial } from "../materials";
import { Rig, disposeScene, frameForCaptions, smooth, span, windowed, type Ctx, type Hud, type StoryScene } from "./common";

// Units: 1 = 1 cm. A sagittal (side) cutaway of an anteverted uterus, patient facing left.
// The transfer catheter follows the true route: along the vagina, through the cervical canal,
// into the cavity, releasing the embryo about 1.3 cm below the top of the cavity under ultrasound guidance.

const AXIS = new THREE.Vector3(-0.42, 0.91, 0).normalize(); // cervix → fundus
const ANT = new THREE.Vector3(-0.91, -0.42, 0).normalize(); // anterior wall direction
const VAG = new THREE.Vector3(-0.38, -0.92, 0).normalize(); // from the external os, down and forward
const local = (u: number, v: number) => AXIS.clone().multiplyScalar(u).addScaledVector(ANT, v);
const OS = local(-3.75, 0);

function closedShape(points: [number, number][]) {
  const c = new THREE.CatmullRomCurve3(points.map(([x, y]) => new THREE.Vector3(x, y, 0)), true, "centripetal");
  return new THREE.Shape(c.getPoints(points.length * 14).map((p) => new THREE.Vector2(p.x, p.y)));
}

function slab(shape: THREE.Shape, half: number, bevel: boolean) {
  const g = new THREE.ExtrudeGeometry(shape, {
    depth: half * 2,
    bevelEnabled: bevel,
    bevelThickness: bevel ? 0.45 : 0.02,
    bevelSize: bevel ? 0.32 : 0.01,
    bevelSegments: bevel ? 8 : 1,
    curveSegments: 48,
  });
  g.translate(0, 0, -half);
  return g;
}

export class TransferScene implements StoryScene {
  id = "transfer" as const;
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(32, 1, 0.05, 200);
  ready = true;

  private rig: Rig;
  private path: THREE.CatmullRomCurve3;
  private catheter: THREE.Mesh;
  private catheterSegments = 420;
  private catheterRadial = 10;
  private embryo: THREE.Mesh;
  private bubbles: THREE.Mesh[] = [];
  private release = new THREE.Vector3();
  private tip = new THREE.Vector3();

  constructor() {
    const s = this.scene;
    s.add(fullscreenQuad(backdropMaterial({ inner: "#381e63", outer: "#100a1d", glow: "#c9a6ee", center: [0.58, 0.52] })));

    const uterus = new THREE.Group();
    uterus.rotation.z = Math.atan2(AXIS.y, AXIS.x);
    s.add(uterus);

    const outer = closedShape([
      [-3.78, 0], [-3.6, 1.05], [-2.4, 1.15], [-1.6, 1.28], [-0.6, 1.58], [0.8, 1.72], [2.2, 1.66], [3.2, 1.25], [3.72, 0.45],
      [3.72, -0.45], [3.2, -1.3], [2.2, -1.72], [0.8, -1.78], [-0.6, -1.62], [-1.6, -1.3], [-2.4, -1.18], [-3.6, -1.05],
    ]);
    const endo = closedShape([
      [-1.65, 0.2], [-0.6, 0.48], [0.6, 0.62], [1.8, 0.64], [2.7, 0.48], [3.15, 0.14], [3.26, 0],
      [3.15, -0.14], [2.7, -0.5], [1.8, -0.66], [0.6, -0.64], [-0.6, -0.5], [-1.65, -0.2],
    ]);
    const cervixLining = closedShape([
      [-3.8, 0.26], [-2.8, 0.3], [-1.6, 0.24], [-1.5, 0], [-1.6, -0.24], [-2.8, -0.3], [-3.8, -0.26],
    ]);
    const cavity = closedShape([
      [-3.84, 0.055], [-1.6, 0.045], [0.4, 0.075], [2.5, 0.06], [3.02, 0], [2.5, -0.06], [0.4, -0.075], [-1.6, -0.045], [-3.84, -0.055],
    ]);

    const myo = tissueMaterial({ color: "#bb6671", deep: "#4a1a24", rim: "#f3aeb7", fibre: 1.5, echo: 0.42 });
    const endoMat = tissueMaterial({ color: "#eb98a5", deep: "#a3415a", rim: "#ffd7dd", fibre: 3.2, echo: 0.84, glow: 0.35 });
    const cervMat = tissueMaterial({ color: "#d98b97", deep: "#7a3242", rim: "#ffcfd6", fibre: 2.2, echo: 0.6 });
    // The slit-like cavity: a muted violet, not a black gash.
    const cavMat = tissueMaterial({ color: "#4f2f5c", deep: "#2a1636", rim: "#7f5c8e", echo: 0.3 });
    const myoMesh = new THREE.Mesh(slab(outer, 1.2, true), myo);
    const endoMesh = new THREE.Mesh(slab(endo, 1.66, false), endoMat);
    const cervMesh = new THREE.Mesh(slab(cervixLining, 1.665, false), cervMat);
    const cavMesh = new THREE.Mesh(slab(cavity, 1.67, false), cavMat);
    uterus.add(myoMesh, endoMesh, cervMesh, cavMesh);

    // A full bladder sits in front of the uterus; it helps the ultrasound view during transfer.
    const bladder = new THREE.Mesh(
      new THREE.SphereGeometry(1.9, 56, 40),
      glassMaterial({ color: "#f3dcc0", rim: "#fff3e2", opacity: 0.07, rimStrength: 0.6, echo: 0.02 }),
    );
    bladder.position.set(-1.8, -3.25, 0);
    bladder.scale.set(1.05, 0.9, 0.9);
    s.add(bladder);

    // The vaginal canal (schematic, translucent).
    const vagCurve = new THREE.CatmullRomCurve3([OS.clone().addScaledVector(VAG, 0.1), OS.clone().addScaledVector(VAG, 3), OS.clone().addScaledVector(VAG, 7)]);
    const vag = new THREE.Mesh(
      new THREE.TubeGeometry(vagCurve, 60, 0.6, 24, false),
      glassMaterial({ color: "#d99aa4", rim: "#ffd3da", opacity: 0.05, rimStrength: 0.45, echo: 0.3 }),
    );
    s.add(vag);

    // Catheter path: along the vagina, curving into the os, up the canal, into the cavity. The release point is about
    // 1.3 cm below the cavity apex (x ≈ 3.02).
    this.release.copy(local(1.75, 0));
    this.path = new THREE.CatmullRomCurve3(
      [
        OS.clone().addScaledVector(VAG, 7.2),
        OS.clone().addScaledVector(VAG, 3.5),
        OS.clone().addScaledVector(VAG, 0.6),
        local(-3.35, 0),
        local(-1.6, 0),
        local(0.4, 0),
        this.release.clone(),
      ].map((p) => p.setZ(1.72)),
      false,
      "centripetal",
    );
    this.release.setZ(1.72);
    const catMat = glassMaterial({ color: "#f4f1ee", rim: "#ffffff", opacity: 0.55, rimStrength: 0.5, rimPow: 1.6, echo: 0.97 });
    this.catheter = new THREE.Mesh(new THREE.TubeGeometry(this.path, this.catheterSegments, 0.055, this.catheterRadial, false), catMat);
    this.catheter.renderOrder = 8;
    s.add(this.catheter);

    // The embryo (shown enlarged; a real blastocyst is about 0.15 mm) with an air bubble either side. The bubbles,
    // not the embryo, make the tiny bright "flash" clinicians watch for on the ultrasound screen.
    this.embryo = glow("#fff3e6", 0.2, 0.16);
    this.embryo.renderOrder = 10;
    s.add(this.embryo);
    for (let i = 0; i < 2; i++) {
      const b = glow("#ffffff", 0.07, 0.3);
      b.renderOrder = 10;
      this.bubbles.push(b);
      s.add(b);
    }

    s.add(motes({ count: 140, box: [26, 18, 16], color: "#d9c8f2", size: 2.4, opacity: 0.4, center: [0, -1, -3] }));

    const tgt = (v: THREE.Vector3) => [v.x, v.y, v.z];
    const at = (u: number, v: number) => local(u, v);
    const os1 = OS.clone().addScaledVector(VAG, 1.2);
    this.rig = new Rig([
      { u: 62.5, target: tgt(os1), pos: [os1.x + 0.9, os1.y + 0.5, 4.5] },
      { u: 64.2, target: tgt(OS), pos: [OS.x + 0.7, OS.y + 0.5, 5.6] },
      { u: 66.2, target: tgt(at(-1, 0)), pos: [at(-1, 0).x + 0.8, at(-1, 0).y + 0.4, 12] },
      { u: 68.4, target: tgt(at(2, 0)), pos: [at(2, 0).x + 0.6, at(2, 0).y + 0.2, 11] },
      { u: 70.6, target: [-0.5, 1.2, 0], pos: [0.6, 0.9, 12] },
      { u: 73.2, target: [-0.4, -0.1, 0], pos: [1.4, 0.1, 17] },
      { u: 76.6, target: [-0.4, 0.15, 0], pos: [-0.8, 0.6, 16.5] },
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
    frameForCaptions(this.camera, ctx, 0.16);
    this.rig.apply(this.camera, u, ctx, 0.06);

    // Insertion then withdrawal, expressed as how far along the path the tip has travelled.
    let sTip = 0.3;
    sTip += span(u, 62.5, 64.2) * 0.25;
    sTip += span(u, 64.2, 66.2) * 0.17;
    sTip += span(u, 66.2, 68.4) * 0.28;
    sTip -= span(u, 69.4, 71.4) * 0.6;
    const segs = Math.max(1, Math.floor(sTip * this.catheterSegments));
    this.catheter.geometry.setDrawRange(0, segs * this.catheterRadial * 6);
    (this.catheter.material as THREE.ShaderMaterial).uniforms.uFade.value = 1 - smooth(70.8, 71.8, u);
    this.path.getPointAt(Math.min(1, sTip), this.tip);

    // Embryo rides at the tip until released at 68.6, then lies free in the middle of the cavity, never on the wall.
    const released = u >= 68.6;
    const pos = released ? this.release : this.tip;
    this.embryo.position.copy(pos);
    const em = this.embryo.material as THREE.ShaderMaterial;
    // Drawn larger as the camera pulls back, so the enlarged embryo never shrinks to a pinprick.
    const grow = Math.max(1, this.camera.position.distanceTo(this.embryo.position) / 8);
    em.uniforms.uScale.value = 0.2 * grow;
    this.bubbles.forEach((b) => ((b.material as THREE.ShaderMaterial).uniforms.uScale.value = 0.07 * grow));
    // A 0.15 mm embryo cannot be seen on ultrasound: hide it while the scan view is on (the bright spot is the air
    // bubbles), and keep it steady rather than pulsing.
    const us = smooth(65.4, 66.4, u) * (1 - smooth(70.2, 71.2, u));
    em.uniforms.uOpacity.value = smooth(62.5, 63.2, u) * (1 - us) * 0.8;
    const tan = this.path.getTangentAt(Math.min(0.999, Math.max(0.001, released ? 1 : sTip)));
    this.bubbles.forEach((b, i) => {
      b.position.copy(this.embryo.position).addScaledVector(tan, i === 0 ? 0.16 : -0.16);
      (b.material as THREE.ShaderMaterial).uniforms.uOpacity.value = smooth(62.5, 63.4, u) * (1 - smooth(72, 74, u)) * 0.9;
    });

    // Ultrasound guidance: a transabdominal sector from above (axis angle 0).
    const w = ctx.width * ctx.dpr;
    const h = ctx.height * ctx.dpr;
    shared.uUS.value = us;
    if (ctx.portrait) shared.uProbe.value.set(w * 0.5, h * 1.02, h * 0.82, 0);
    else shared.uProbe.value.set(w * 0.64, h * 1.03, h * 0.85, 0);
  }

  hud(u: number): Hud {
    return {
      labels: [
        { id: "cervix", pos: local(-2.9, -1.35).setZ(1.7), a: windowed(u, 63.4, 66.6) },
        { id: "catheter", pos: OS.clone().addScaledVector(VAG, 2.4).add(new THREE.Vector3(0.15, 0, 1.7)), a: windowed(u, 63.6, 66.8) },
        { id: "endometrium", pos: local(1.0, 0.78).setZ(1.7), a: windowed(u, 68.8, 73) },
        // During the scan the bright spot is labelled as the bubbles; the embryo is labelled once the scan view is off.
        { id: "flash", pos: this.release.clone().add(new THREE.Vector3(0.3, 0.25, 0)), a: windowed(u, 68.9, 71.2) },
        { id: "embryoT", pos: this.embryo.position.clone().add(new THREE.Vector3(0.2, 0.22, 0)), a: windowed(u, 71.4, 75.6) },
        { id: "uterus", pos: local(0.4, -2.0).setZ(1.6), a: windowed(u, 71.2, 76) },
        { id: "bladder", pos: new THREE.Vector3(-2.2, -2.4, 1.6), a: windowed(u, 71.6, 76) },
      ],
      scale: { from: new THREE.Vector3(-4.6, -6.0, 1.7), to: new THREE.Vector3(-3.6, -6.0, 1.7), label: "1 cm", a: windowed(u, 70.8, 76) },
    };
  }

  dispose() {
    disposeScene(this.scene);
  }
}
