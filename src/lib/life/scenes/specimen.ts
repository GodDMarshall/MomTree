import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { embryoStages as ES } from "../story";
import { backdropMaterial, cellMaterial, fullscreenQuad, glassMaterial, glow, motes, spermMaterial, tissueMaterial } from "../materials";
import {
  Rig,
  clamp01,
  disposeScene,
  easeOut,
  fibonacciSphere,
  frameForCaptions,
  rng,
  smooth,
  span,
  taperedTube,
  windowed,
  type Ctx,
  type Hud,
  type StoryScene,
} from "./common";

// Units: 1 = 100 µm. Oocyte ~110 µm across (r 0.55), zona pellucida ~15 µm thick (0.62–0.75),
// corona cells ~10–15 µm, sperm ~55 µm long with a ~4.5 µm head. ICSI needle tip ~7 µm.

const E = new THREE.Vector3(5.0, 0, 0); // the ICSI egg, which becomes the embryo
const N_SPERM = 46;
const N_CORONA = 380;
const MAX_CELLS = 40;
const N_TE = 72;
const N_ICM = 14;

type Cell = { p: THREE.Vector3; s: THREE.Vector3; q: THREE.Quaternion };
type Stage = { cells: Cell[]; parent: number[] };

function spermGeometry() {
  const head = new THREE.SphereGeometry(1, 14, 10);
  head.scale(0.0235, 0.0155, 0.0065);
  const tail = taperedTube(new THREE.LineCurve3(new THREE.Vector3(-0.016, 0, 0), new THREE.Vector3(-0.56, 0, 0)), 70, 5, (u) =>
    u < 0.09 ? 0.0046 : 0.0042 * (1 - u) + 0.0009,
  );
  return mergeGeometries([head, tail])!;
}

function sphereCell(p: THREE.Vector3, r: number, squash?: THREE.Vector3): Cell {
  return { p: p.clone(), s: squash ? squash.clone() : new THREE.Vector3(r, r, r), q: new THREE.Quaternion() };
}

function nearestParent(dir: THREE.Vector3, parents: Cell[]) {
  let best = 0;
  let bd = Infinity;
  parents.forEach((c, i) => {
    const d = c.p.lengthSq() < 1e-6 ? 0 : 1 - dir.clone().normalize().dot(c.p.clone().normalize());
    if (d < bd) {
      bd = d;
      best = i;
    }
  });
  return best;
}

export class SpecimenScene implements StoryScene {
  id = "specimen" as const;
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(30, 1, 0.01, 100);
  ready = true;

  private rig: Rig;
  private ivf = new THREE.Group();
  private sperm: THREE.InstancedMesh;
  private spermData: { S: THREE.Vector3; T: THREE.Vector3; t0: number; t1: number; seed: number; side: THREE.Vector3 }[] = [];
  private winnerPos = new THREE.Vector3();
  private ivfZona: THREE.ShaderMaterial[] = [];

  private egg: THREE.Mesh;
  private eggMat: THREE.ShaderMaterial;
  private zonaOuter: THREE.Mesh;
  private zonaInner: THREE.Mesh;
  private polar1: THREE.Mesh;
  private polar2: THREE.Mesh;
  private holding = new THREE.Group();
  private needle = new THREE.Group();
  private needleSperm: THREE.InstancedMesh;
  private pronuclei: THREE.Mesh[] = [];

  private cells: THREE.InstancedMesh;
  private te: THREE.InstancedMesh;
  private teMat: THREE.ShaderMaterial;
  private cavity: THREE.Mesh;
  private stages: Stage[] = [];
  private tmp = new THREE.Matrix4();
  private tmpV = new THREE.Vector3();
  private icmCentre = new THREE.Vector3();
  /** The embryo itself (cells, outer layer, cavity), which hatches out of the zona before implanting. */
  private body = new THREE.Group();
  private zonaMats: THREE.ShaderMaterial[] = [];
  private wall: THREE.Mesh;
  private contact: THREE.Mesh;

  constructor() {
    const s = this.scene;
    s.add(fullscreenQuad(backdropMaterial({ inner: "#3d2169", outer: "#100a1d", glow: "#cfaaf0", center: [0.6, 0.5] })));
    const r = rng(11);

    // ------------------------------------------------------------------ the IVF egg, its zona and corona
    const ivfEggMat = cellMaterial({ color: "#f0b6bc", deep: "#9a4d5d", rim: "#ffe0e3", granule: 9, opacity: 1 });
    const ivfEgg = new THREE.Mesh(new THREE.SphereGeometry(0.55, 72, 54), ivfEggMat);
    this.ivf.add(ivfEgg);
    for (const [rad, op] of [
      [0.75, 0.05],
      [0.62, 0.03],
    ] as const) {
      const m = glassMaterial({ color: "#f8d9de", rim: "#fff1f2", opacity: op, rimStrength: 0.75, rimPow: 3.2 });
      this.ivfZona.push(m);
      const z = new THREE.Mesh(new THREE.SphereGeometry(rad, 64, 48), m);
      z.renderOrder = 6;
      this.ivf.add(z);
    }
    const polar = new THREE.Mesh(new THREE.SphereGeometry(0.06, 24, 18), ivfEggMat);
    polar.position.set(0.12, 0.57, 0.12);
    this.ivf.add(polar);

    const coronaMat = cellMaterial({ color: "#f1dcdc", deep: "#9a7088", rim: "#fff6f6", granule: 18 });
    const corona = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 2), coronaMat, N_CORONA);
    const q = new THREE.Quaternion();
    const tint = new THREE.Color();
    for (let i = 0; i < N_CORONA; i++) {
      const dir = new THREE.Vector3(r() - 0.5, r() - 0.5, r() - 0.5).normalize();
      const rad = 0.79 + Math.pow(r(), 1.9) * 0.52;
      const sc = 0.046 + r() * 0.028;
      q.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
      this.tmp.compose(dir.multiplyScalar(rad), q, new THREE.Vector3(sc, sc, sc * 0.88));
      corona.setMatrixAt(i, this.tmp);
      corona.setColorAt(i, tint.setHSL(0.92 + r() * 0.06, 0.22, 0.86 + r() * 0.08));
    }
    this.ivf.add(corona);

    // Sperm: instanced, each with its own beat phase and fade.
    const sg = spermGeometry();
    const seedArr = new Float32Array(N_SPERM);
    const alphaArr = new Float32Array(N_SPERM);
    const beatArr = new Float32Array(N_SPERM).fill(1);
    for (let i = 0; i < N_SPERM; i++) {
      seedArr[i] = r();
      // Targets biased toward the camera side so the approach reads clearly.
      const T = new THREE.Vector3(r() - 0.5, r() - 0.5, r() * 0.8 + 0.1).normalize();
      // Start positions lie roughly in the picture plane, so sperm swim in from the sides, never at the lens.
      const S = new THREE.Vector3(T.x + (r() - 0.5) * 0.8, T.y + (r() - 0.5) * 0.8, T.z * 0.25 + (r() - 0.5) * 0.4)
        .normalize()
        .multiplyScalar(2.0 + r() * 1.3);
      const winner = i === 0;
      const t0 = winner ? 27.4 : 26.8 + r() * 2.4;
      const t1 = winner ? 31.2 : t0 + 3.0 + r() * 1.8;
      const target = T.clone().multiplyScalar(winner ? 0.76 : i % 3 === 1 ? 0.77 + r() * 0.03 : 0.92 + r() * 0.36); // many bind to the zona; one fuses
      const side = new THREE.Vector3().crossVectors(T, new THREE.Vector3(0, 1, 0)).normalize();
      this.spermData.push({ S, T: target, t0, t1, seed: r() * 10, side });
    }
    sg.setAttribute("aSeed", new THREE.InstancedBufferAttribute(seedArr, 1));
    sg.setAttribute("aAlpha", new THREE.InstancedBufferAttribute(alphaArr, 1));
    sg.setAttribute("aBeat", new THREE.InstancedBufferAttribute(beatArr, 1));
    this.sperm = new THREE.InstancedMesh(sg, spermMaterial(), N_SPERM);
    this.sperm.frustumCulled = false;
    this.sperm.renderOrder = 8;
    this.ivf.add(this.sperm);
    s.add(this.ivf);

    // ------------------------------------------------------------------ the ICSI egg (later the embryo)
    const icsi = new THREE.Group();
    icsi.position.copy(E);
    s.add(icsi);

    this.eggMat = cellMaterial({ color: "#f0b6bc", deep: "#9a4d5d", rim: "#ffe0e3", granule: 9, opacity: 0.62, transparent: true });
    this.egg = new THREE.Mesh(new THREE.SphereGeometry(0.55, 96, 72), this.eggMat);
    this.egg.renderOrder = 5;
    icsi.add(this.egg);

    const zm1 = glassMaterial({ color: "#f8d9de", rim: "#fff1f2", opacity: 0.05, rimStrength: 0.75, rimPow: 3.2 });
    const zm2 = glassMaterial({ color: "#f8d9de", rim: "#fff1f2", opacity: 0.03, rimStrength: 0.6, rimPow: 3.2 });
    this.zonaOuter = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 48), zm1);
    this.zonaInner = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 48), zm2);
    this.zonaOuter.renderOrder = 7;
    this.zonaInner.renderOrder = 6;
    icsi.add(this.zonaOuter, this.zonaInner);
    this.zonaMats = [zm1, zm2];

    const pbMat = cellMaterial({ color: "#efb9bd", deep: "#9a5260", rim: "#ffe6e8", granule: 14 });
    this.polar1 = new THREE.Mesh(new THREE.SphereGeometry(0.062, 24, 18), pbMat);
    this.polar1.position.set(-0.08, 0.585, 0.16);
    this.polar2 = new THREE.Mesh(new THREE.SphereGeometry(0.052, 24, 18), pbMat);
    this.polar2.position.set(0.05, 0.6, 0.12);
    icsi.add(this.polar1, this.polar2);

    // Pronuclei, seen through the translucent cytoplasm.
    const pnMat = cellMaterial({ color: "#f9dcd6", deep: "#c99098", rim: "#ffffff", granule: 22, glow: 0.4 });
    for (let i = 0; i < 2; i++) {
      const pn = new THREE.Mesh(new THREE.SphereGeometry(0.11, 40, 30), pnMat);
      pn.renderOrder = 1;
      this.pronuclei.push(pn);
      icsi.add(pn);
    }

    // Holding pipette (fire-polished glass, from the left) and injection needle (from the right).
    const glassP = glassMaterial({ color: "#dfe7ef", rim: "#ffffff", opacity: 0.05, rimStrength: 0.85, rimPow: 2.2 });
    glassP.uniforms.uAxisFade.value.set(0.35, 0.9); // both pipettes fade out about 35–90 µm behind their tips
    const holdProfile = [
      [0.11, 0], [0.2, 0.012], [0.3, 0.035], [0.38, 0.075], [0.415, 0.13], [0.42, 0.22], [0.42, 7.5],
    ].map(([x, y]) => new THREE.Vector2(x, y));
    const hold = new THREE.Mesh(new THREE.LatheGeometry(holdProfile, 48), glassP);
    // The lumen shares the lathe's tip-at-0 axis, so the fade behind the tip applies to both.
    const lumenGeo = new THREE.CylinderGeometry(0.1, 0.1, 7.5, 32, 1, true);
    lumenGeo.translate(0, 3.75, 0);
    const lumen = new THREE.Mesh(lumenGeo, glassP);
    this.holding.add(hold, lumen);
    this.holding.rotation.z = Math.PI / 2; // +y → −x: the tip points right, toward the egg
    this.holding.renderOrder = 9;
    icsi.add(this.holding);

    const needleProfile = [
      [0.0, 0], [0.012, 0.02], [0.035, 0.08], [0.05, 0.4], [0.08, 1.2], [0.14, 2.4], [0.22, 3.6], [0.3, 6.5],
    ].map(([x, y]) => new THREE.Vector2(x, y));
    const needleMesh = new THREE.Mesh(new THREE.LatheGeometry(needleProfile, 40), glassP);
    this.needle.add(needleMesh);
    this.needle.rotation.z = -Math.PI / 2; // +y → +x: the tip points left, toward the egg
    this.needle.renderOrder = 9;
    icsi.add(this.needle);

    // The single, immobilised sperm carried in the needle (embryologists stop its tail before ICSI).
    const ns = spermGeometry();
    ns.setAttribute("aSeed", new THREE.InstancedBufferAttribute(new Float32Array([0.3]), 1));
    ns.setAttribute("aAlpha", new THREE.InstancedBufferAttribute(new Float32Array([1]), 1));
    ns.setAttribute("aBeat", new THREE.InstancedBufferAttribute(new Float32Array([0]), 1));
    this.needleSperm = new THREE.InstancedMesh(ns, spermMaterial(), 1);
    this.needleSperm.frustumCulled = false;
    this.needleSperm.renderOrder = 2;
    icsi.add(this.needleSperm);

    // ------------------------------------------------------------------ embryo cells
    const cellMat = cellMaterial({ color: "#f0b2ba", deep: "#8e4553", rim: "#ffdfe3", granule: 9 });
    this.cells = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 48, 36), cellMat, MAX_CELLS);
    this.cells.frustumCulled = false;
    icsi.add(this.cells);
    this.teMat = cellMaterial({ color: "#f3bcc3", deep: "#a05362", rim: "#ffe6ea", granule: 11, opacity: 1, transparent: true });
    this.te = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 28, 20), this.teMat, N_TE);
    this.te.frustumCulled = false;
    this.te.renderOrder = 4;
    icsi.add(this.te);
    for (let i = 0; i < MAX_CELLS; i++) this.cells.setColorAt(i, tint.setHSL(0.975 + r() * 0.03, 0.55, 0.8 + r() * 0.08));
    for (let i = 0; i < N_TE; i++) this.te.setColorAt(i, tint.setHSL(0.98 + r() * 0.02, 0.5, 0.84 + r() * 0.06));

    this.cavity = new THREE.Mesh(
      new THREE.SphereGeometry(1, 48, 36),
      glassMaterial({ color: "#f6c9cf", rim: "#ffe9ec", opacity: 0.025, rimStrength: 0.35, rimPow: 1.8 }),
    );
    this.cavity.renderOrder = 3;
    icsi.add(this.cavity);
    icsi.add(this.body);
    this.body.add(this.cells, this.te, this.cavity);

    // Implantation: the lining of the uterus (endometrium), staged as a dark violet-rose floor that
    // rises into view and that the hatched blastocyst settles onto.
    this.wall = new THREE.Mesh(
      new THREE.SphereGeometry(9, 128, 96),
      tissueMaterial({ color: "#5a2a52", deep: "#1f0c1d", rim: "#8f5a86", glow: 0.04, fibre: 1.2 }),
    );
    this.wall.position.set(0.2, -16, -0.3);
    this.wall.visible = false;
    this.wall.renderOrder = 2;
    icsi.add(this.wall);
    this.contact = glow("#ffd9e0", 0.9, 0.1);
    this.contact.renderOrder = 10;
    icsi.add(this.contact);

    this.buildStages(r);

    s.add(motes({ count: 120, box: [10, 6, 8], color: "#dccbf3", size: 1.6, opacity: 0.35, center: [1.8, 0, -1] }));

    // Distances follow from the 30° field of view: ~4.3 units frames the 150 µm zona at about
    // two-thirds of the screen height.
    const x = E.x;
    this.rig = new Rig([
      { u: 26.0, target: [0, 0, 0], pos: [0.15, 0.12, 1.0] },
      { u: 27.6, target: [0, 0, 0], pos: [0.9, 0.8, 4.9] },
      { u: 30.6, target: [0, 0, 0], pos: [-1.4, 1.0, 4.7] },
      { u: 33.6, target: [0.05, 0, 0], pos: [0.3, 0.5, 4.2] },
      { u: 35.4, target: [x, 0, 0], pos: [x, 0.5, 4.8] },
      { u: 38.0, target: [x + 0.1, 0, 0], pos: [x + 0.05, 0.45, 4.2] },
      { u: 40.6, target: [x, 0, 0], pos: [x - 0.15, 0.7, 4.3] },
      { u: 44.0, target: [x, 0, 0], pos: [x - 0.7, 1.0, 4.1] },
      { u: 50.0, target: [x, 0, 0], pos: [x + 1.3, 1.2, 3.9] },
      { u: 56.0, target: [x, 0, 0], pos: [x - 1.0, 1.4, 4.0] },
      { u: 60.6, target: [x, 0.05, 0], pos: [x + 0.7, 1.5, 4.4] },
      { u: 61.9, target: [x, 0.05, 0], pos: [x + 0.4, 1.1, 4.3] },
      // After the transfer: the blastocyst hatches and settles into the lining below it.
      { u: 63.2, target: [x + 0.1, 0, 0], pos: [x + 0.45, 0.85, 5.0] },
      { u: 66.6, target: [x + 0.15, -0.45, -0.2], pos: [x + 0.7, 0.35, 4.6] },
      { u: 70, target: [x + 0.15, -0.7, -0.25], pos: [x + 0.55, -0.05, 4.1] },
      { u: 72, target: [x + 0.15, -0.75, -0.25], pos: [x + 0.5, -0.15, 3.8] },
    ]);
  }

  /** Cell layouts for each stage, with each cell mapped to its parent in the previous stage. */
  private buildStages(r: () => number) {
    const S0: Stage = { cells: [sphereCell(new THREE.Vector3(), 0.55)], parent: [0] };
    const S1: Stage = {
      cells: [
        sphereCell(new THREE.Vector3(-0.245, 0, 0), 0, new THREE.Vector3(0.37, 0.45, 0.45)),
        sphereCell(new THREE.Vector3(0.245, 0, 0), 0, new THREE.Vector3(0.355, 0.43, 0.44)),
      ],
      parent: [0, 0],
    };
    const tet = [
      [1, 1, 1],
      [-1, -1, 1],
      [-1, 1, -1],
      [1, -1, -1],
    ].map(([x, y, z]) => new THREE.Vector3(x, y, z).normalize().multiplyScalar(0.245));
    // Rotate so the 4-cell reads as a cluster from the camera rather than a flat diamond.
    const rot = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.3, 0.5, 0.15));
    tet.forEach((p) => p.applyQuaternion(rot));
    // Blastomeres are slightly uneven in size, as in real embryos.
    const S2: Stage = { cells: tet.map((p, i) => sphereCell(p, 0.335 * [1.04, 0.95, 1.0, 0.97][i])), parent: tet.map((p) => (p.x < 0 ? 0 : 1)) };
    const cube: THREE.Vector3[] = [];
    for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) cube.push(new THREE.Vector3(x, y, z).normalize().multiplyScalar(0.3).applyQuaternion(rot));
    const S3: Stage = { cells: cube.map((p) => sphereCell(p, 0.268 * (0.92 + r() * 0.16))), parent: cube.map((p) => nearestParent(p, S2.cells)) };
    const outer = fibonacciSphere(24).map((d) => d.multiplyScalar(0.36));
    const inner = [new THREE.Vector3(0.08, 0.05, 0), new THREE.Vector3(-0.08, -0.04, 0.05), new THREE.Vector3(0, 0.06, -0.08), new THREE.Vector3(0.02, -0.08, -0.03)];
    const morCells = [...outer.map((p) => sphereCell(p, 0.2)), ...inner.map((p) => sphereCell(p, 0.18))];
    const S4: Stage = { cells: morCells, parent: morCells.map((c) => nearestParent(c.p, S3.cells)) };
    this.stages = [S0, S1, S2, S3, S4];
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
    this.rig.apply(this.camera, u, ctx, 0.12);
    this.camera.updateMatrixWorld();
    const time = performance.now() / 1000;

    // -------------------------------------------------------------- conventional IVF
    this.ivf.visible = u < 35.8;
    if (this.ivf.visible) {
      const a = this.sperm.geometry.getAttribute("aAlpha") as THREE.InstancedBufferAttribute;
      const q = new THREE.Quaternion();
      const p = new THREE.Vector3();
      const prev = new THREE.Vector3();
      const reaction = smooth(32.4, 33.0, u);
      this.spermData.forEach((d, i) => {
        const k = clamp01((u - d.t0) / (d.t1 - d.t0));
        const posAt = (kk: number, out: THREE.Vector3) => {
          out.lerpVectors(d.S, d.T, kk);
          out.addScaledVector(d.side, Math.sin(kk * Math.PI * 3 + d.seed) * 0.09 * (1 - kk));
          return out;
        };
        posAt(k, p);
        posAt(Math.max(0, k - 0.02), prev);
        let alpha = smooth(d.t0, d.t0 + 0.6, u);
        if (i === 0) {
          // The first sperm passes the zona and fuses with the egg.
          const enter = span(u, 31.2, 32.5);
          p.copy(d.T).multiplyScalar(1 - enter * 0.34);
          if (enter > 0) prev.copy(d.T).multiplyScalar(1.05);
          alpha *= 1 - smooth(32.5, 33.1, u);
          this.winnerPos.copy(p);
        } else {
          // Others wriggle in place, among the corona cells or bound to the zona, then fade after the zona reaction.
          if (k >= 1) p.addScaledVector(d.side, Math.sin(time * 3 + d.seed) * 0.01);
          alpha *= 1 - smooth(33.2, 34.6, u);
        }
        alpha *= 1 - smooth(34.2, 35.2, u);
        const dir = p.clone().sub(prev);
        if (dir.lengthSq() < 1e-8) dir.copy(d.T).negate().add(d.S);
        q.setFromUnitVectors(new THREE.Vector3(1, 0, 0), dir.normalize());
        this.tmp.compose(p, q, new THREE.Vector3(1, 1, 1));
        this.sperm.setMatrixAt(i, this.tmp);
        // Keep the swimmers off the words: fade sperm over the caption column, the navigation band and, on phones, the copy at the bottom.
        const s = this.tmpV.copy(p).project(this.camera);
        const keep = ctx.portrait
          ? Math.min(smooth(-0.24, 0.0, s.y), 1 - smooth(0.7, 0.84, s.y))
          : Math.min(smooth(-0.34, -0.14, s.x), 1 - smooth(0.72, 0.86, s.y));
        a.setX(i, alpha * 0.95 * keep);
      });
      this.sperm.instanceMatrix.needsUpdate = true;
      a.needsUpdate = true;
      // The zona reaction after fertilisation: a brief brightening of the shell.
      this.ivfZona.forEach((m) => (m.uniforms.uRimStrength.value = 0.75 + reaction * (1 - smooth(33.2, 34.4, u)) * 0.9));
    }

    // -------------------------------------------------------------- ICSI
    const tipHold = -4.6 + span(u, 34.9, 36.4) * 3.84 - span(u, 40.2, 41.4) * 3.84; // −4.6 → −0.76 → back
    this.holding.position.set(tipHold, 0, 0);
    let tip = 4.6;
    tip -= span(u, 34.9, 36.4) * 3.1; // 4.6 → 1.5
    tip -= span(u, 36.6, 36.95) * 0.74; // → 0.76 at the zona
    tip -= span(u, 36.95, 37.6) * 0.46; // → 0.3, pressing the membrane in
    tip -= span(u, 37.62, 38.0) * 0.25; // → 0.05 once the membrane gives
    tip += span(u, 38.6, 40.0) * 4.55; // withdraw
    this.needle.position.set(tip, 0, 0);
    // The membrane dents only once the tip has crossed the zona and reaches it.
    const dent = THREE.MathUtils.clamp((0.58 - tip) / 0.28, 0, 1) * (1 - smooth(37.6, 37.72, u));
    this.eggMat.uniforms.uDent.value = dent;
    // The sperm sits in the needle until it is expelled into the cytoplasm.
    const expelled = span(u, 38.0, 38.5);
    const spermX = THREE.MathUtils.lerp(tip + 0.36, -0.06, expelled);
    const sq = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 0, 0), new THREE.Vector3(-1, 0, 0));
    this.tmp.compose(new THREE.Vector3(Math.max(spermX, -0.06), 0, 0), sq, new THREE.Vector3(1, 1, 1));
    this.needleSperm.setMatrixAt(0, this.tmp);
    this.needleSperm.instanceMatrix.needsUpdate = true;
    const nsa = this.needleSperm.geometry.getAttribute("aAlpha") as THREE.InstancedBufferAttribute;
    nsa.setX(0, smooth(34.9, 35.8, u) * (1 - smooth(40.6, 41.6, u)));
    nsa.needsUpdate = true;
    this.holding.visible = u > 34.6 && u < 41.6;
    this.needle.visible = u > 34.6 && u < 40.2;

    // -------------------------------------------------------------- pronuclei → syngamy
    const pnIn = span(u, 40.8, 41.8);
    const pnClose = span(u, 41.8, 43.6);
    const pnOut = smooth(44.2, 44.9, u);
    this.pronuclei.forEach((pn, i) => {
      const side = i === 0 ? -1 : 1;
      pn.position.set(side * THREE.MathUtils.lerp(0.21, 0.118, pnClose), 0.02 * side, 0.02);
      pn.scale.setScalar(Math.max(0.0001, pnIn * (1 - pnOut)));
      pn.visible = pnIn > 0.001 && pnOut < 0.999;
    });
    // Polar bodies lie under the zona, outside the embryo; they are not drawn once the blastocyst forms.
    const pbOn = u < ES.blastocyst[0];
    this.polar1.visible = pbOn;
    this.polar2.visible = u > 40.8 && pbOn;
    this.polar2.scale.setScalar(Math.max(0.001, span(u, 40.8, 41.6)));

    // The egg becomes fully opaque as the pronuclei break down, ready to divide.
    this.eggMat.uniforms.uOpacity.value = THREE.MathUtils.lerp(0.62, 1, smooth(44.0, 44.95, u));
    this.egg.visible = u < ES.cleave2[0];

    // -------------------------------------------------------------- cleavage, morula, blastocyst
    this.layoutEmbryo(u, time);

    // Zona thins and expands with the blastocyst.
    const expand = span(u, 59.2, 62);
    this.zonaInner.scale.setScalar(THREE.MathUtils.lerp(0.62, 0.735, expand));
    this.zonaOuter.scale.setScalar(THREE.MathUtils.lerp(0.75, 0.79, expand));

    // -------------------------------------------------------------- hatching and implantation
    // The blastocyst slips out of the zona, turning its inner cell mass toward the lining, and
    // settles into it. Illustrative: in life this takes place over several days after transfer.
    const hatch = span(u, 63.4, 66.6);
    this.body.position.set(hatch * 0.1, -hatch * 0.62 - span(u, 67.4, 72) * 0.08, 0);
    this.body.rotation.x = hatch * Math.PI; // the inner cell mass turns down to face the lining
    // The empty zona drifts up and away and fades out completely.
    const zf = 1 - span(u, 63.8, 67.2);
    this.zonaMats.forEach((m) => (m.uniforms.uFade.value = zf));
    this.zonaOuter.position.set(-hatch * 0.25, hatch * 0.35, -hatch * 0.25);
    this.zonaInner.position.copy(this.zonaOuter.position);
    this.wall.visible = u > 64;
    // Sphere radius 9: it rises until its top rests at y = -1.25, just under the blastocyst.
    this.wall.position.set(0.2, THREE.MathUtils.lerp(-16, -10.25, span(u, 64.5, 67.4)), -0.3);
    this.contact.position.set(0.3, -1.22, 0);
    (this.contact.material as THREE.ShaderMaterial).uniforms.uOpacity.value = windowed(u, 67.2, 72.5, 1.4) * 0.5;
  }

  private layoutEmbryo(u: number, time: number) {
    const st = this.stages;
    const pairs: [number, readonly [number, number]][] = [
      [1, ES.cleave2],
      [2, ES.cleave4],
      [3, ES.cleave8],
      [4, ES.morula],
    ];
    const blast = u >= ES.blastocyst[0];
    this.te.visible = blast;
    this.cavity.visible = blast;
    if (u < ES.cleave2[0]) {
      this.cells.count = 0;
      return;
    }

    const breath = (j: number, p: THREE.Vector3) => p.clone().multiplyScalar(1 + Math.sin(time * 0.9 + j * 1.7) * 0.012);

    if (!blast) {
      let to = 1;
      let t = 1;
      for (const [k, [a, b]] of pairs) {
        if (u >= a) {
          to = k;
          t = span(u, a, b);
        }
      }
      const from = st[to - 1];
      const target = st[to];
      const compaction = to === 4 ? span(u, ES.morula[1], ES.morula[1] + 1) : 0;
      this.cells.count = target.cells.length;
      target.cells.forEach((c, j) => {
        const par = from.cells[target.parent[j]];
        const p = new THREE.Vector3().lerpVectors(par.p, c.p, easeOut(t));
        const sc = new THREE.Vector3().lerpVectors(par.s, c.s, t);
        if (compaction) {
          p.multiplyScalar(1 - compaction * 0.11);
          sc.multiplyScalar(1 + compaction * 0.17);
        }
        this.tmp.compose(breath(j, p), c.q, sc);
        this.cells.setMatrixAt(j, this.tmp);
      });
      this.cells.instanceMatrix.needsUpdate = true;
      return;
    }

    // Blastocyst: compacted morula cells become the outer layer (trophectoderm) and the inner cell mass.
    const morula = st[4].cells;
    const t = span(u, ES.blastocyst[0], ES.blastocyst[1]);
    const expand = span(u, ES.blastocyst[1], 62);
    const R = THREE.MathUtils.lerp(0.48, 0.58, t) + expand * 0.1;
    const dirs = fibonacciSphere(N_TE);
    const z = new THREE.Vector3(0, 0, 1);
    const q = new THREE.Quaternion();
    const pole = new THREE.Vector3(0, 1, 0);
    dirs.forEach((d, j) => {
      const par = morula[nearestParent(d, morula.slice(0, 24))];
      const p = new THREE.Vector3().lerpVectors(par.p.clone().multiplyScalar(0.89), d.clone().multiplyScalar(R), easeOut(t));
      q.setFromUnitVectors(z, d);
      const tang = THREE.MathUtils.lerp(0.2, 0.152, t);
      const rad = THREE.MathUtils.lerp(0.2, 0.05, t);
      this.tmp.compose(breath(j, p), q, new THREE.Vector3(tang, tang, rad));
      this.te.setMatrixAt(j, this.tmp);
    });
    this.te.instanceMatrix.needsUpdate = true;
    this.teMat.uniforms.uOpacity.value = THREE.MathUtils.lerp(1, 0.22, span(u, ES.blastocyst[1] - 1, ES.blastocyst[1] + 0.8));

    // Inner cell mass: a cluster against the wall at one pole.
    this.icmCentre.copy(pole).multiplyScalar(R * 0.62);
    const rr = rng(5);
    this.cells.count = N_ICM;
    for (let j = 0; j < N_ICM; j++) {
      const off = new THREE.Vector3(rr() - 0.5, (rr() - 0.5) * 0.6, rr() - 0.5).normalize().multiplyScalar(0.06 + rr() * 0.1);
      const target = this.icmCentre.clone().add(off);
      const par = morula[24 + (j % 4)];
      const p = new THREE.Vector3().lerpVectors(par.p, target, easeOut(t));
      const sc = THREE.MathUtils.lerp(0.18, 0.088, t);
      this.tmp.compose(breath(j, p), new THREE.Quaternion(), new THREE.Vector3(sc, sc, sc));
      this.cells.setMatrixAt(j, this.tmp);
    }
    this.cells.instanceMatrix.needsUpdate = true;
    this.cavity.scale.setScalar(R * 0.9);
    (this.cavity.material as THREE.ShaderMaterial).uniforms.uFade.value = span(u, ES.blastocyst[0] + 1, ES.blastocyst[1]);
  }

  hud(u: number): Hud {
    const w = (p: THREE.Vector3) => p.clone().add(E);
    return {
      labels: [
        { id: "corona", pos: new THREE.Vector3(0.95, -0.85, 0.4), a: windowed(u, 28, 31.4) },
        { id: "zona", pos: new THREE.Vector3(-0.62, 0.4, 0.3), a: windowed(u, 28.4, 31.4) },
        { id: "sperm", pos: this.winnerPos.clone(), a: windowed(u, 29.4, 31.6) },
        { id: "holding", pos: w(new THREE.Vector3(-1.0, 0.62, 0)), a: windowed(u, 35.8, 39.6) },
        // On the shaft just behind the moving tip (the glass fades out further back).
        { id: "needle", pos: w(new THREE.Vector3(this.needle.position.x + 0.3, 0.045, 0)), a: windowed(u, 35.8, 38.4) },
        { id: "pronuclei", pos: w(new THREE.Vector3(0.12, 0.13, 0.05)), a: windowed(u, 41.8, 44.4) },
        { id: "icm", pos: this.body.localToWorld(this.icmCentre.clone().add(new THREE.Vector3(0, 0.05, 0))), a: windowed(u, 59.4, 62.2) },
        { id: "hatch", pos: this.body.localToWorld(new THREE.Vector3(0, 0, 0)).add(new THREE.Vector3(0, 0.78, 0.2)), a: windowed(u, 64, 67.2) },
        { id: "endometrium", pos: w(new THREE.Vector3(1.0, -1.32, 0.3)), a: windowed(u, 67.4, 71.8) },
        { id: "te", pos: w(new THREE.Vector3(0.62, -0.25, 0.1)), a: windowed(u, 59.8, 62.2) },
        { id: "cavity", pos: w(new THREE.Vector3(-0.05, -0.18, 0.1)), a: windowed(u, 60.2, 62.2) },
      ],
      scale:
        u < 35
          ? { from: new THREE.Vector3(-1.25, -1.05, 0), to: new THREE.Vector3(-0.75, -1.05, 0), label: "50 µm", a: windowed(u, 27.8, 34.4) }
          : { from: w(new THREE.Vector3(-1.0, -0.85, 0)), to: w(new THREE.Vector3(-0.5, -0.85, 0)), label: "50 µm", a: windowed(u, 36.4, 71.8) },
    };
  }

  dispose() {
    disposeScene(this.scene);
  }
}
