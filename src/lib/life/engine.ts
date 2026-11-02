import * as THREE from "three";
import { plates, sceneAt, type SceneId } from "./story";
import { shared } from "./materials";
import { damp, type Ctx, type StoryScene, type Tier } from "./scenes/common";
import { PlateScene } from "./scenes/plate";
import { AnatomyScene } from "./scenes/anatomy";
import { SpecimenScene } from "./scenes/specimen";
import { TransferScene } from "./scenes/transfer";
import { PregnancyScene } from "./scenes/pregnancy";

export type { Tier };

export type FrameInfo = {
  u: number;
  scene: SceneId;
  rendered: boolean;
  labels: { id: string; x: number; y: number; a: number }[];
  scale: { x: number; y: number; px: number; label: string; a: number } | null;
};

/** Rough GPU tier from the device and the WebGL renderer string. */
export function detectTier(): Tier {
  const nav = navigator as Navigator & { deviceMemory?: number };
  const mem = nav.deviceMemory ?? 8;
  const cores = nav.hardwareConcurrency ?? 8;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  let gpu = "";
  try {
    const c = document.createElement("canvas");
    const gl = c.getContext("webgl2");
    const ext = gl?.getExtension("WEBGL_debug_renderer_info");
    gpu = ext && gl ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : "";
  } catch {
    /* ignore */
  }
  if (/swiftshader|llvmpipe|software|mali-4|adreno \(tm\) 3/i.test(gpu) || mem <= 2) return "low";
  if (coarse || cores <= 4 || mem <= 4) return "mid";
  return "high";
}

export function supportsWebGL2() {
  try {
    const c = document.createElement("canvas");
    return Boolean(c.getContext("webgl2"));
  } catch {
    return false;
  }
}

export class LifeEngine {
  onFrame?: (f: FrameInfo) => void;
  onLost?: () => void;

  private renderer: THREE.WebGLRenderer;
  private scenes: Record<SceneId, StoryScene>;
  private ctx: Ctx;
  private target = 0;
  private u = 0;
  private raf = 0;
  private last = 0;
  private visible = true;
  private running = false;
  private pointerTarget = new THREE.Vector2();
  private times: number[] = [];
  private maxDpr: number;
  private dpr: number;
  private laidOut = new Set<SceneId>();
  private tmpA = new THREE.Vector3();
  private tmpB = new THREE.Vector3();

  constructor(canvas: HTMLCanvasElement, opts: { tier: Tier; portrait: boolean; preserveDrawingBuffer?: boolean }) {
    THREE.ColorManagement.enabled = false;
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: opts.tier !== "low",
      alpha: true,
      powerPreference: "high-performance",
      preserveDrawingBuffer: Boolean(opts.preserveDrawingBuffer),
    });
    this.renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    this.renderer.setClearColor(0x000000, 0);
    const deviceDpr = window.devicePixelRatio || 1;
    this.maxDpr = opts.tier === "high" ? Math.min(deviceDpr, 2) : opts.tier === "mid" ? Math.min(deviceDpr, 1.5) : 1;
    this.dpr = this.maxDpr;
    this.renderer.setPixelRatio(this.dpr);

    this.ctx = {
      pointer: new THREE.Vector2(),
      portrait: opts.portrait,
      tier: opts.tier,
      width: canvas.clientWidth || window.innerWidth,
      height: canvas.clientHeight || window.innerHeight,
      dpr: this.dpr,
    };

    this.scenes = {
      mother: new PlateScene({ id: "mother", ...plates.mother, zoom: [3.5, 10.8, 1, 2.35], pan: [3.5, 10.4], bloom: [8.4, 11], fabric: true, moteColor: "#f3d7a8" }),
      anatomy: new AnatomyScene(),
      specimen: new SpecimenScene(),
      transfer: new TransferScene(),
      pregnancy: new PregnancyScene(),
      hands: new PlateScene({ id: "hands", ...plates.hands, zoom: [85.5, 88.5, 1.02, 1.12], moteColor: "#f5d9ad" }),
      newborn: new PlateScene({ id: "newborn", ...plates.newborn, zoom: [88.5, 100, 1.0, 1.1], moteColor: "#f6dcae" }),
    };

    canvas.addEventListener("webglcontextlost", this.handleLost, false);
    window.addEventListener("pointermove", this.handlePointer, { passive: true });
  }

  /** Load the opening plate, then start rendering. Later plates load in the background. */
  async start() {
    this.resize();
    await this.scenes.mother.load(this.ctx);
    this.running = true;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.loop);
    const later = () => {
      this.scenes.hands.load(this.ctx);
      this.scenes.newborn.load(this.ctx);
    };
    if ("requestIdleCallback" in window) (window as Window & { requestIdleCallback: (cb: () => void) => number }).requestIdleCallback(later);
    else setTimeout(later, 2000);
  }

  setProgress(u: number) {
    this.target = u;
  }

  /** Jump without easing (used for poster capture and chapter links). */
  jumpTo(u: number) {
    this.target = u;
    this.u = u;
  }

  setVisible(v: boolean) {
    if (v === this.visible) return;
    this.visible = v;
    if (v && this.running) {
      this.last = performance.now();
      cancelAnimationFrame(this.raf);
      this.raf = requestAnimationFrame(this.loop);
    }
  }

  setPortrait(p: boolean) {
    this.ctx.portrait = p;
    this.resize();
  }

  resize() {
    const canvas = this.renderer.domElement;
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    this.ctx.width = w;
    this.ctx.height = h;
    this.ctx.dpr = this.dpr;
    this.renderer.setPixelRatio(this.dpr);
    this.renderer.setSize(w, h, false);
    shared.uRes.value.set(w * this.dpr, h * this.dpr);
    this.laidOut.clear();
  }

  /** Render one specific moment synchronously (poster capture, tests). */
  renderAt(u: number) {
    this.jumpTo(u);
    this.frame(0);
  }

  dispose() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    window.removeEventListener("pointermove", this.handlePointer);
    this.renderer.domElement.removeEventListener("webglcontextlost", this.handleLost);
    Object.values(this.scenes).forEach((s) => s.dispose());
    this.renderer.dispose();
  }

  // ---------------------------------------------------------------------------------------------
  private handleLost = (e: Event) => {
    e.preventDefault();
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.onLost?.();
  };

  private handlePointer = (e: PointerEvent) => {
    this.pointerTarget.set((e.clientX / window.innerWidth) * 2 - 1, -((e.clientY / window.innerHeight) * 2 - 1));
  };

  private loop = (now: number) => {
    if (!this.running || !this.visible) return;
    const dt = Math.min(0.1, (now - this.last) / 1000);
    this.last = now;
    this.frame(dt);
    this.govern(dt);
    this.raf = requestAnimationFrame(this.loop);
  };

  private frame(dt: number) {
    this.u = damp(this.u, this.target, 7.5, dt || 1);
    if (Math.abs(this.u - this.target) < 0.002) this.u = this.target;
    shared.uTime.value += dt;
    this.ctx.pointer.x = damp(this.ctx.pointer.x, this.pointerTarget.x, 2.5, dt || 1);
    this.ctx.pointer.y = damp(this.ctx.pointer.y, this.pointerTarget.y, 2.5, dt || 1);

    const id = sceneAt(this.u);
    const sc = this.scenes[id];
    shared.uUS.value = 0;
    if (!sc.ready) {
      void sc.load(this.ctx);
      this.renderer.clear();
      this.onFrame?.({ u: this.u, scene: id, rendered: false, labels: [], scale: null });
      return;
    }
    if (!this.laidOut.has(id)) {
      sc.layout(this.ctx);
      this.laidOut.add(id);
    }
    sc.update(this.u, dt, this.ctx);
    this.renderer.render(sc.scene, sc.camera);

    // Project labels and the scale bar for the HTML overlay.
    const hud = sc.hud(this.u);
    const W = this.ctx.width;
    const H = this.ctx.height;
    const labels = hud.labels
      .filter((l) => l.a > 0.01)
      .map((l) => {
        const p = this.tmpA.copy(l.pos).project(sc.camera);
        const inFront = p.z < 1;
        return { id: l.id, x: (p.x * 0.5 + 0.5) * W, y: (-p.y * 0.5 + 0.5) * H, a: inFront ? l.a : 0 };
      });
    let scale: FrameInfo["scale"] = null;
    if (hud.scale && hud.scale.a > 0.01) {
      const a = this.tmpA.copy(hud.scale.from).project(sc.camera);
      const b = this.tmpB.copy(hud.scale.to).project(sc.camera);
      const ax = (a.x * 0.5 + 0.5) * W;
      const bx = (b.x * 0.5 + 0.5) * W;
      const ay = (-a.y * 0.5 + 0.5) * H;
      const by = (-b.y * 0.5 + 0.5) * H;
      scale = { x: ax, y: ay, px: Math.hypot(bx - ax, by - ay), label: hud.scale.label, a: hud.scale.a };
    }
    this.onFrame?.({ u: this.u, scene: id, rendered: true, labels, scale });
  }

  /** Lower the resolution if frames are slow; raise it again when there is headroom. */
  private govern(dt: number) {
    // Ignore stalls (background tabs, throttled frames); they say nothing about GPU load.
    if (!dt || dt > 0.09) return;
    this.times.push(dt);
    if (this.times.length < 50) return;
    const avg = this.times.reduce((s, x) => s + x, 0) / this.times.length;
    this.times.length = 0;
    let next = this.dpr;
    if (avg > 1 / 38) next = Math.max(0.75, this.dpr - 0.2);
    else if (avg < 1 / 57 && this.dpr < this.maxDpr) next = Math.min(this.maxDpr, this.dpr + 0.1);
    if (Math.abs(next - this.dpr) > 0.01) {
      this.dpr = next;
      this.resize();
    }
  }
}
