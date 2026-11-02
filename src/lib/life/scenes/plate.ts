import * as THREE from "three";
import type { SceneId } from "../story";
import { fabricMaterial, fullscreenQuad, motes, plateMaterial, shared } from "../materials";
import { damp, span, type Ctx, type Hud, type StoryScene } from "./common";

type PlateOpts = {
  id: SceneId;
  base: string;
  focus: [number, number];
  zoomTo: [number, number];
  /** [from, to, zoomStart, zoomEnd] in story units. */
  zoom: [number, number, number, number];
  pan?: [number, number];
  bloom?: [number, number];
  fabric?: boolean;
  moteColor: string;
};

/**
 * A photographic plate inside the 3D scene: the image is a full-screen layer with depth parallax,
 * a light sweep and bloom, with real 3D elements (sheer fabric, floating motes) in front of it.
 */
export class PlateScene implements StoryScene {
  id: SceneId;
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(38, 1, 0.1, 60);
  ready = false;
  private opts: PlateOpts;
  private material?: THREE.ShaderMaterial;
  private fabric?: THREE.Mesh;
  private motes: THREE.Points;
  private pointer = new THREE.Vector2();
  private loading?: Promise<void>;

  constructor(opts: PlateOpts) {
    this.id = opts.id;
    this.opts = opts;
    this.camera.position.set(0, 0, 6);
    this.motes = motes({ count: 140, box: [12, 8, 9], color: opts.moteColor, size: 3.2, opacity: 0.8 });
    this.scene.add(this.motes);
    if (opts.fabric) {
      const geo = new THREE.PlaneGeometry(7.5, 4.2, 90, 50);
      this.fabric = new THREE.Mesh(geo, fabricMaterial());
      this.fabric.position.set(-1.6, -1.9, 1.4);
      this.fabric.rotation.set(-0.5, 0.25, -0.32);
      this.fabric.renderOrder = 2;
      this.scene.add(this.fabric);
    }
  }

  load(ctx: Ctx) {
    if (this.loading) return this.loading;
    const size = ctx.tier === "high" && !ctx.portrait ? 2048 : 1280;
    const url = `${this.opts.base}-${size}.webp`;
    this.loading = new THREE.TextureLoader()
      .loadAsync(url)
      .then((tex) => {
        tex.generateMipmaps = true;
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.anisotropy = 4;
        this.material = plateMaterial(tex, this.opts.focus, this.opts.zoomTo);
        const quad = fullscreenQuad(this.material);
        this.scene.add(quad);
        this.ready = true;
      })
      .catch(() => {
        // Leave ready = false: the HTML image underneath stays visible.
      });
    return this.loading;
  }

  layout(ctx: Ctx) {
    this.camera.aspect = ctx.width / ctx.height;
    this.camera.updateProjectionMatrix();
    (this.motes.material as THREE.ShaderMaterial).uniforms.uPixelRatio.value = ctx.dpr;
    if (this.fabric) this.fabric.position.x = ctx.portrait ? -0.6 : -1.6;
  }

  update(u: number, dt: number, ctx: Ctx) {
    const o = this.opts;
    const m = this.material;
    this.pointer.x = damp(this.pointer.x, ctx.pointer.x, 3, dt);
    this.pointer.y = damp(this.pointer.y, ctx.pointer.y, 3, dt);
    if (m) {
      const z = span(u, o.zoom[0], o.zoom[1]);
      m.uniforms.uZoom.value = o.zoom[2] + (o.zoom[3] - o.zoom[2]) * z;
      m.uniforms.uPan.value = o.pan ? span(u, o.pan[0], o.pan[1]) : 0;
      m.uniforms.uBloom.value = o.bloom ? span(u, o.bloom[0], o.bloom[1]) : 0;
      m.uniforms.uPointer.value.copy(this.pointer);
    }
    if (this.fabric) {
      const fm = this.fabric.material as THREE.ShaderMaterial;
      fm.uniforms.uOpacity.value = 1 - span(u, 4, 7.5);
      this.fabric.position.y = -1.9 - span(u, 3, 8) * 1.2;
    }
    // Motes drift toward the camera as it pushes in.
    this.motes.position.z = span(u, o.zoom[0], o.zoom[1]) * 2.5;
    this.camera.position.x = this.pointer.x * 0.25;
    this.camera.position.y = this.pointer.y * 0.18;
    this.camera.lookAt(0, 0, 0);
    void shared;
  }

  hud(): Hud {
    return { labels: [], scale: null };
  }

  dispose() {
    this.scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      mesh.geometry?.dispose();
      const mat = mesh.material as THREE.ShaderMaterial | undefined;
      mat?.uniforms?.uMap?.value?.dispose?.();
      mat?.dispose?.();
    });
  }
}
