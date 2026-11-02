import * as THREE from "three";
import type { SceneId } from "../story";

export type Tier = "high" | "mid" | "low";

export type Ctx = {
  pointer: THREE.Vector2;
  portrait: boolean;
  tier: Tier;
  width: number;
  height: number;
  dpr: number;
};

export type Label = { id: string; pos: THREE.Vector3; a: number };
export type ScaleBar = { from: THREE.Vector3; to: THREE.Vector3; label: string; a: number };
export type Hud = { labels: Label[]; scale: ScaleBar | null };

export interface StoryScene {
  id: SceneId;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  /** Becomes true once textures (if any) have loaded. */
  ready: boolean;
  load(ctx: Ctx): Promise<void>;
  update(u: number, dt: number, ctx: Ctx): void;
  hud(u: number): Hud;
  layout(ctx: Ctx): void;
  dispose(): void;
}

// ---------------------------------------------------------------------------- maths helpers
export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smooth = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
/** 0→1 across [a,b], held at 0 before and 1 after, eased. */
export const span = (u: number, a: number, b: number) => easeInOut(clamp01((u - a) / (b - a)));
/** Visibility window with soft edges: fades in over `f` after a, out over `f` before b. */
export const windowed = (u: number, a: number, b: number, f = 0.6) => Math.min(smooth(a, a + f, u), 1 - smooth(b - f, b, u));
export const damp = (current: number, target: number, lambda: number, dt: number) => lerp(current, target, 1 - Math.exp(-lambda * dt));

/** Catmull-Rom track over scroll units: smooth camera paths through keyframes. */
export class Track {
  private keys: { u: number; v: number[] }[];
  constructor(keys: { u: number; v: number[] }[]) {
    this.keys = [...keys].sort((a, b) => a.u - b.u);
  }
  at(u: number, out: number[] = []): number[] {
    const k = this.keys;
    if (u <= k[0].u) return k[0].v.slice();
    if (u >= k[k.length - 1].u) return k[k.length - 1].v.slice();
    let i = 0;
    while (i < k.length - 2 && u > k[i + 1].u) i++;
    const k0 = k[Math.max(0, i - 1)];
    const k1 = k[i];
    const k2 = k[i + 1];
    const k3 = k[Math.min(k.length - 1, i + 2)];
    const t = easeInOut(clamp01((u - k1.u) / (k2.u - k1.u))) * 0.6 + clamp01((u - k1.u) / (k2.u - k1.u)) * 0.4;
    const t2 = t * t;
    const t3 = t2 * t;
    for (let d = 0; d < k1.v.length; d++) {
      const p0 = k0.v[d];
      const p1 = k1.v[d];
      const p2 = k2.v[d];
      const p3 = k3.v[d];
      out[d] = 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
    }
    return out;
  }
}

/** A camera rig: position and target tracks, with extra distance in portrait screens. */
export class Rig {
  pos: Track;
  target: Track;
  private tmpT = new THREE.Vector3();
  private tmpP = new THREE.Vector3();
  constructor(keys: { u: number; pos: number[]; target: number[] }[]) {
    this.pos = new Track(keys.map((k) => ({ u: k.u, v: k.pos })));
    this.target = new Track(keys.map((k) => ({ u: k.u, v: k.target })));
  }
  apply(camera: THREE.PerspectiveCamera, u: number, ctx: Ctx, sway = 0) {
    const t = this.target.at(u);
    const p = this.pos.at(u);
    this.tmpT.set(t[0], t[1], t[2]);
    this.tmpP.set(p[0], p[1], p[2]);
    // Framing is authored for 16:9. Narrower screens pull the camera back so the subject still fits.
    const aspect = ctx.width / ctx.height;
    const k = ctx.portrait ? Math.min(2.3, Math.max(1, 1.05 / aspect)) : Math.max(1, 1.72 / aspect);
    if (k !== 1) this.tmpP.sub(this.tmpT).multiplyScalar(k).add(this.tmpT);
    // Pointer parallax: a few degrees of gentle orbit.
    if (sway) {
      const off = this.tmpP.clone().sub(this.tmpT);
      off.applyAxisAngle(new THREE.Vector3(0, 1, 0), -ctx.pointer.x * sway);
      off.applyAxisAngle(new THREE.Vector3(1, 0, 0), ctx.pointer.y * sway * 0.6);
      this.tmpP.copy(this.tmpT).add(off);
    }
    camera.position.copy(this.tmpP);
    camera.lookAt(this.tmpT);
  }
}

/**
 * Shift the projection so the subject sits beside the captions: right of centre on wide screens,
 * above centre on portrait screens (where captions sit at the bottom).
 */
export function frameForCaptions(camera: THREE.PerspectiveCamera, ctx: Ctx, shift = 0.12) {
  const w = ctx.width;
  const h = ctx.height;
  if (ctx.portrait) camera.setViewOffset(w, h, 0, h * 0.16, w, h);
  else camera.setViewOffset(w, h, -w * shift, 0, w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

/** Tube with a radius that varies along its length (fallopian tubes, embryo body, fimbriae). */
export function taperedTube(curve: THREE.Curve<THREE.Vector3>, tubular: number, radial: number, radius: (u: number) => number) {
  const g = new THREE.TubeGeometry(curve, tubular, 1, radial, false);
  const pos = g.attributes.position as THREE.BufferAttribute;
  const nrm = g.attributes.normal as THREE.BufferAttribute;
  const p = new THREE.Vector3();
  for (let i = 0; i <= tubular; i++) {
    const u = i / tubular;
    curve.getPointAt(u, p);
    const r = radius(u);
    for (let j = 0; j <= radial; j++) {
      const k = i * (radial + 1) + j;
      pos.setXYZ(k, p.x + nrm.getX(k) * r, p.y + nrm.getY(k) * r, p.z + nrm.getZ(k) * r);
    }
  }
  pos.needsUpdate = true;
  return g;
}

/** Seeded random so the scenes look identical on every visit (and in poster captures). */
export function rng(seed = 1) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function fibonacciSphere(n: number, out: THREE.Vector3[] = []) {
  const g = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const th = g * i;
    out.push(new THREE.Vector3(Math.cos(th) * r, y, Math.sin(th) * r));
  }
  return out;
}

export function disposeScene(scene: THREE.Scene) {
  scene.traverse((o) => {
    const m = o as THREE.Mesh;
    if (m.geometry) m.geometry.dispose();
    const mat = m.material as THREE.Material | THREE.Material[] | undefined;
    if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
    else if (mat) {
      const sm = mat as THREE.ShaderMaterial;
      if (sm.uniforms) for (const k in sm.uniforms) (sm.uniforms[k].value as THREE.Texture | undefined)?.dispose?.();
      mat.dispose();
    }
  });
}
