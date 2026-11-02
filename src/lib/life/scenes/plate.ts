import * as THREE from "three";
import { plateSizes, type PlateFraming, type SceneId, type SizeKey } from "../story";
import { fabricMaterial, fullscreenQuad, motes, plateMaterial, setPlateImage } from "../materials";
import { damp, span, type Ctx, type Hud, type StoryScene } from "./common";

type PlateOpts = PlateFraming & {
  id: SceneId;
  /** Optional portrait (9:16) version, used on tall screens. */
  tall?: PlateFraming;
  /** [from, to, zoomStart, zoomEnd] in story units. */
  zoom: [number, number, number, number];
  pan?: [number, number];
  bloom?: [number, number];
  fabric?: boolean;
  moteColor: string;
};

type Variant = "wide" | "tall";

/**
 * A photographic plate inside the 3D scene: the image is a full-screen layer with depth parallax,
 * a light sweep and bloom, with real 3D elements (sheer fabric, floating motes) in front of it.
 * On tall screens it uses the portrait version of the photograph when one exists, and swaps
 * between the two if the device rotates.
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
  private variant: Variant | null = null;
  private loadingVariant: Variant | null = null;
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

  private wanted(ctx: Ctx): Variant {
    return ctx.portrait && this.opts.tall ? "tall" : "wide";
  }

  /** The smallest variant that stays sharp at this screen size and pixel ratio (up to 4K). */
  private sizeFor(framing: PlateFraming, ctx: Ctx): SizeKey {
    const sizes = plateSizes(framing.asset);
    const need = Math.max(ctx.width, ctx.height) * ctx.dpr * 0.92;
    const fit = sizes.find(([, [w, h]]) => Math.max(w, h) >= need) ?? sizes[sizes.length - 1];
    return fit ? fit[0] : "1k";
  }

  private loadedKey = "";

  load(ctx: Ctx) {
    const v = this.wanted(ctx);
    const framing = v === "tall" ? this.opts.tall! : this.opts;
    const rank = { "1k": 0, "2k": 1, "4k": 2 } as const;
    let size = this.sizeFor(framing, ctx);
    // Never trade a sharper texture for a smaller one just because the window shrank.
    const [loadedVariant, loadedSize] = this.loadedKey.split(":") as [Variant | "", SizeKey | undefined];
    if (this.ready && loadedVariant === v && loadedSize && rank[size] <= rank[loadedSize]) size = loadedSize;
    const key = `${v}:${size}`;
    if (this.ready && this.loadedKey === key) return Promise.resolve();
    if (this.loading && this.loadingVariant === v && this.loadingKey === key) return this.loading;
    this.loadingVariant = v;
    this.loadingKey = key;
    this.loading = new THREE.TextureLoader()
      .loadAsync(`${framing.base}-${size}.webp`)
      .then((tex) => {
        if (this.loadingKey !== key) {
          tex.dispose(); // a newer request (rotation or resize) superseded this one
          return;
        }
        tex.generateMipmaps = true;
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.anisotropy = 4;
        if (!this.material) {
          this.material = plateMaterial(tex, framing.focus, framing.zoomTo);
          this.scene.add(fullscreenQuad(this.material));
        } else {
          setPlateImage(this.material, tex, framing.focus, framing.zoomTo);
        }
        this.variant = v;
        this.loadedKey = key;
        this.ready = true;
      })
      .catch(() => {
        // Keep whatever is showing; on first load the HTML image underneath stays visible.
      })
      .finally(() => {
        if (this.loadingKey === key) this.loading = undefined;
      });
    return this.loading;
  }

  private loadingKey = "";

  layout(ctx: Ctx) {
    this.camera.aspect = ctx.width / ctx.height;
    this.camera.updateProjectionMatrix();
    (this.motes.material as THREE.ShaderMaterial).uniforms.uPixelRatio.value = ctx.dpr;
    if (this.fabric) this.fabric.position.x = ctx.portrait ? -0.6 : -1.6;
    // Rotation (wide ↔ tall) or a move to a larger, denser screen loads a better-fitting variant.
    if (this.ready) void this.load(ctx);
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
