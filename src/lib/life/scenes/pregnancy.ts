import * as THREE from "three";
import { backdropMaterial, cellMaterial, fullscreenQuad, glassMaterial, glow, motes } from "../materials";
import { Rig, disposeScene, frameForCaptions, smooth, taperedTube, windowed, type Ctx, type Hud, type StoryScene } from "./common";

// Units: 1 = 1 cm. Early pregnancy at about 7 weeks: a gestational sac (~2.7 cm) with chorionic
// villi, the amnion around a ~1 cm C-shaped embryo with limb buds and a beating heart, and the
// yolk sac outside the amnion. Accurate to stage; deliberately not a "baby".

const AMNION = new THREE.Vector3(-0.15, 0.05, 0.1);

export class PregnancyScene implements StoryScene {
  id = "pregnancy" as const;
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(30, 1, 0.02, 100);
  ready = true;

  private rig: Rig;
  private group = new THREE.Group();
  private heart: THREE.Mesh;
  private body: THREE.CatmullRomCurve3;
  private yolkPos = new THREE.Vector3(0.82, -0.42, 0.25);

  constructor() {
    const s = this.scene;
    s.add(fullscreenQuad(backdropMaterial({ inner: "#5b2c37", outer: "#1d0e11", glow: "#f0b3bd", center: [0.6, 0.5] })));
    s.add(this.group);

    // Chorionic sac, its surface softened by villi.
    const chorion = new THREE.Mesh(
      new THREE.SphereGeometry(1.35, 96, 72),
      glassMaterial({ color: "#eab7be", rim: "#ffdade", opacity: 0.05, rimStrength: 0.8, rimPow: 2.2, fuzz: 0.045 }),
    );
    chorion.renderOrder = 8;
    this.group.add(chorion);

    // Amnion around the embryo.
    const amnion = new THREE.Mesh(new THREE.SphereGeometry(0.64, 64, 48), glassMaterial({ color: "#f6d6da", rim: "#fff2f3", opacity: 0.03, rimStrength: 0.55, rimPow: 2.6 }));
    amnion.position.copy(AMNION);
    amnion.renderOrder = 7;
    this.group.add(amnion);

    // The embryo: C-shaped, crown-rump ~1 cm, head end larger, tapering tail.
    this.body = new THREE.CatmullRomCurve3(
      [
        [0.05, 0.43, 0], [0.27, 0.32, 0.01], [0.36, 0.07, 0.02], [0.31, -0.2, 0.03], [0.14, -0.37, 0.02], [-0.04, -0.4, 0],
      ].map(([x, y, z]) => new THREE.Vector3(x, y, z).add(AMNION)),
      false,
      "centripetal",
    );
    const radius = (u: number) => 0.035 + 0.12 * Math.exp(-(((u - 0.1) / 0.16) ** 2)) + 0.1 * (1 - THREE.MathUtils.smoothstep(u, 0.25, 0.95)) + 0.02 * Math.exp(-(((u - 0.42) / 0.1) ** 2));
    const embryoMat = cellMaterial({ color: "#f3b6bc", deep: "#a1515f", rim: "#ffe3e6", granule: 6, opacity: 1 });
    const embryo = new THREE.Mesh(taperedTube(this.body, 120, 24, radius), embryoMat);
    this.group.add(embryo);
    const headCap = new THREE.Mesh(new THREE.SphereGeometry(radius(0) * 1.02, 32, 24), embryoMat);
    headCap.position.copy(this.body.getPointAt(0));
    this.group.add(headCap);

    // Limb buds on the ventral side (the inside of the C).
    const centre = new THREE.Vector3(0.1, 0.0, 0).add(AMNION);
    const bud = (u: number, size: number) => {
      const p = this.body.getPointAt(u);
      const ventral = centre.clone().sub(p).normalize();
      const m = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), embryoMat);
      m.scale.set(size, size * 0.62, size * 0.62);
      m.position.copy(p).addScaledVector(ventral, radius(u) * 0.75).add(new THREE.Vector3(0, 0, 0.06));
      m.lookAt(p.clone().addScaledVector(ventral, 1));
      this.group.add(m);
    };
    bud(0.4, 0.058);
    bud(0.72, 0.05);

    // Heart: a soft pulse at ~150 beats per minute, typical at this stage.
    const hp = this.body.getPointAt(0.36);
    const ventral = centre.clone().sub(hp).normalize();
    this.heart = glow("#ffd0c4", 0.16, 0.25);
    this.heart.position.copy(hp).addScaledVector(ventral, radius(0.36) * 0.9).add(new THREE.Vector3(0, 0, 0.05));
    this.heart.renderOrder = 9;
    this.group.add(this.heart);

    // Yolk sac outside the amnion, joined by the vitelline duct.
    const yolk = new THREE.Mesh(new THREE.SphereGeometry(0.2, 40, 30), glassMaterial({ color: "#ffe2c4", rim: "#fff6ea", opacity: 0.18, rimStrength: 1.1, rimPow: 1.8 }));
    yolk.position.copy(this.yolkPos);
    yolk.renderOrder = 6;
    this.group.add(yolk);
    const yolkGlow = glow("#ffd9b0", 0.55, 0.1);
    yolkGlow.position.copy(this.yolkPos);
    this.group.add(yolkGlow);
    const ductStart = this.body.getPointAt(0.5);
    const duct = new THREE.CatmullRomCurve3([ductStart, ductStart.clone().lerp(this.yolkPos, 0.5).add(new THREE.Vector3(0.05, 0.12, 0.1)), this.yolkPos.clone().add(new THREE.Vector3(-0.15, 0.05, 0))]);
    this.group.add(new THREE.Mesh(taperedTube(duct, 40, 8, () => 0.022), embryoMat));
    // Connecting stalk toward the chorion wall (the future umbilical cord).
    const stalkStart = this.body.getPointAt(0.6);
    const stalk = new THREE.CatmullRomCurve3([stalkStart, new THREE.Vector3(-0.55, 0.55, -0.1), new THREE.Vector3(-0.85, 1.0, -0.2)]);
    this.group.add(new THREE.Mesh(taperedTube(stalk, 40, 10, (u) => 0.05 - u * 0.012), embryoMat));

    s.add(motes({ count: 110, box: [9, 6, 8], color: "#f2c3b6", size: 1.8, opacity: 0.4 }));

    this.rig = new Rig([
      { u: 76.5, target: [0.1, 0.0, 0.1], pos: [0.35, 0.15, 1.3] },
      { u: 78.6, target: [0.05, 0, 0], pos: [1.4, 0.9, 7.3] },
      { u: 82.0, target: [0.05, 0, 0], pos: [-1.9, 1.2, 7.0] },
      { u: 85.6, target: [0.0, 0, 0], pos: [-0.4, 0.4, 3.4] },
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
    frameForCaptions(this.camera, ctx, 0.15);
    this.rig.apply(this.camera, u, ctx, 0.1);
    const t = performance.now() / 1000;
    // 150 bpm: a quick double rise each beat.
    const beat = (t * 2.5) % 1;
    const pulse = Math.exp(-(((beat - 0.12) / 0.07) ** 2)) + 0.55 * Math.exp(-(((beat - 0.32) / 0.07) ** 2));
    const hm = this.heart.material as THREE.ShaderMaterial;
    hm.uniforms.uOpacity.value = (0.25 + pulse * 0.75) * smooth(77.5, 78.6, u);
    hm.uniforms.uScale.value = 0.12 + pulse * 0.05;
    this.group.rotation.y = Math.sin(t * 0.15) * 0.08;
  }

  hud(u: number): Hud {
    return {
      labels: [
        { id: "sac", pos: new THREE.Vector3(-0.9, 1.05, 0.3), a: windowed(u, 78.6, 83.4) },
        { id: "yolk", pos: this.yolkPos.clone().add(new THREE.Vector3(0.12, -0.22, 0.1)), a: windowed(u, 79, 83.4) },
        { id: "embryo7", pos: this.body.getPointAt(0.05).clone().add(new THREE.Vector3(0.05, 0.16, 0.1)), a: windowed(u, 79.4, 83.4) },
      ],
      scale: { from: new THREE.Vector3(-1.6, -1.5, 0), to: new THREE.Vector3(-0.6, -1.5, 0), label: "1 cm", a: windowed(u, 78.6, 83.6) },
    };
  }

  dispose() {
    disposeScene(this.scene);
  }
}
