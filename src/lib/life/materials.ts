import * as THREE from "three";
import { NOISE, ULTRASOUND } from "./glsl";

type RGB = THREE.ColorRepresentation;
const col = (c: RGB) => new THREE.Color(c);

/** Shared per-frame uniforms, updated once by the engine and referenced by every material. */
export const shared = {
  uTime: { value: 0 },
  uRes: { value: new THREE.Vector2(1, 1) },
  uUS: { value: 0 },
  uProbe: { value: new THREE.Vector3(0, 0, 0) },
};

// ------------------------------------------------------------------------------------------- cells
const CELL_VERT = /* glsl */ `
varying vec3 vN;
varying vec3 vV;
varying vec3 vObj;
varying vec3 vTint;
uniform float uDent;
uniform vec3 uDentDir;
void main(){
  vec3 pos = position;
  // A soft dimple where a needle presses on the membrane (used during ICSI).
  float d = dot(normalize(position), uDentDir);
  pos -= normalize(position) * uDent * 0.16 * smoothstep(0.86, 1.0, d);
  mat4 m = modelMatrix;
  #ifdef USE_INSTANCING
    m = modelMatrix * instanceMatrix;
  #endif
  vec4 wp = m * vec4(pos, 1.0);
  mat3 nm = transpose(inverse(mat3(m)));
  vN = normalize(nm * normal);
  vV = normalize(cameraPosition - wp.xyz);
  vObj = pos;
  #ifdef USE_INSTANCING_COLOR
    vTint = instanceColor;
  #else
    vTint = vec3(1.0);
  #endif
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

const CELL_FRAG = /* glsl */ `
uniform vec3 uColor;
uniform vec3 uDeep;
uniform vec3 uRim;
uniform vec3 uLight;
uniform float uOpacity;
uniform float uGranule;
uniform float uTime;
uniform float uGlow;
varying vec3 vN;
varying vec3 vV;
varying vec3 vObj;
varying vec3 vTint;
${NOISE}
void main(){
  vec3 n = normalize(vN);
  vec3 v = normalize(vV);
  vec3 l = normalize(uLight);
  float ndl = dot(n, l);
  float wrap = clamp((ndl + 0.55) / 1.55, 0.0, 1.0);
  float fres = pow(1.0 - clamp(dot(n, v), 0.0, 1.0), 2.2);
  float g1 = snoise(vObj * uGranule + vec3(0.0, uTime * 0.04, 0.0)) * 0.5 + 0.5;
  float g2 = snoise(vObj * uGranule * 2.9 - vec3(uTime * 0.03)) * 0.5 + 0.5;
  vec3 base = mix(uDeep, uColor, wrap) * vTint;
  base *= 0.82 + 0.26 * g1 * g2;
  float back = pow(clamp(dot(v, -l), 0.0, 1.0), 2.0) * (1.0 - wrap);
  vec3 c = base + uRim * fres * (1.1 + uGlow) + uColor * back * 0.22;
  float a = clamp(mix(uOpacity, 1.0, fres * 0.7), 0.0, 1.0);
  gl_FragColor = vec4(c, a);
}`;

export function cellMaterial(o: { color: RGB; deep: RGB; rim: RGB; opacity?: number; granule?: number; glow?: number; transparent?: boolean }) {
  return new THREE.ShaderMaterial({
    vertexShader: CELL_VERT,
    fragmentShader: CELL_FRAG,
    transparent: o.transparent ?? (o.opacity ?? 1) < 1,
    depthWrite: !(o.transparent ?? (o.opacity ?? 1) < 1),
    uniforms: {
      uColor: { value: col(o.color) },
      uDeep: { value: col(o.deep) },
      uRim: { value: col(o.rim) },
      uLight: { value: new THREE.Vector3(-0.4, 0.8, 0.6) },
      uOpacity: { value: o.opacity ?? 1 },
      uGranule: { value: o.granule ?? 7 },
      uGlow: { value: o.glow ?? 0 },
      uDent: { value: 0 },
      uDentDir: { value: new THREE.Vector3(1, 0, 0) },
      uTime: shared.uTime,
    },
  });
}

// ------------------------------------------------------------------------------------------- glass
const GLASS_VERT = /* glsl */ `
varying vec3 vN;
varying vec3 vV;
varying vec3 vObj;
uniform float uFuzz;
uniform float uTime;
${NOISE}
void main(){
  vec3 pos = position;
  if (uFuzz > 0.0) {
    float f = snoise(position * 6.0 + vec3(0.0, uTime * 0.05, 0.0));
    pos += normal * f * uFuzz;
  }
  mat4 m = modelMatrix;
  #ifdef USE_INSTANCING
    m = modelMatrix * instanceMatrix;
  #endif
  vec4 wp = m * vec4(pos, 1.0);
  vN = normalize(transpose(inverse(mat3(m))) * normal);
  vV = normalize(cameraPosition - wp.xyz);
  vObj = position;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

const GLASS_FRAG = /* glsl */ `
uniform vec3 uColor;
uniform vec3 uRim;
uniform float uOpacity;
uniform float uRimStrength;
uniform float uRimPow;
uniform float uStriae;
uniform float uTime;
uniform float uFade;
uniform float uEcho;
varying vec3 vN;
varying vec3 vV;
varying vec3 vObj;
${NOISE}
${ULTRASOUND}
void main(){
  vec3 n = normalize(vN);
  vec3 v = normalize(vV);
  float facing = clamp(abs(dot(n, v)), 0.0, 1.0);
  float fres = pow(1.0 - facing, uRimPow);
  float s = uStriae > 0.0 ? snoise(vObj * vec3(2.0, 9.0, 2.0) + uTime * 0.02) * uStriae : 0.0;
  vec3 c = mix(uColor, uRim, fres) + s * 0.12;
  float a = (uOpacity + fres * uRimStrength + s * 0.05) * (gl_FrontFacing ? 1.0 : 0.55);
  c = usShade(c, uEcho, uTime);
  gl_FragColor = vec4(c, clamp(a, 0.0, 1.0) * uFade);
}`;

export function glassMaterial(o: {
  color: RGB;
  rim: RGB;
  opacity?: number;
  rimStrength?: number;
  rimPow?: number;
  striae?: number;
  fuzz?: number;
  additive?: boolean;
  echo?: number;
  side?: THREE.Side;
}) {
  return new THREE.ShaderMaterial({
    vertexShader: GLASS_VERT,
    fragmentShader: GLASS_FRAG,
    transparent: true,
    depthWrite: false,
    side: o.side ?? THREE.DoubleSide,
    blending: o.additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    uniforms: {
      uColor: { value: col(o.color) },
      uRim: { value: col(o.rim) },
      uOpacity: { value: o.opacity ?? 0.08 },
      uRimStrength: { value: o.rimStrength ?? 0.85 },
      uRimPow: { value: o.rimPow ?? 2.4 },
      uStriae: { value: o.striae ?? 0 },
      uFuzz: { value: o.fuzz ?? 0 },
      uFade: { value: 1 },
      uEcho: { value: o.echo ?? 0.5 },
      uTime: shared.uTime,
      uUS: shared.uUS,
      uProbe: shared.uProbe,
    },
  });
}

// ------------------------------------------------------------------------------------------- tissue
const TISSUE_FRAG = /* glsl */ `
uniform vec3 uColor;
uniform vec3 uDeep;
uniform vec3 uRim;
uniform vec3 uLight;
uniform float uOpacity;
uniform float uFibre;
uniform float uTime;
uniform float uEcho;
uniform float uFade;
uniform float uGlow;
varying vec3 vN;
varying vec3 vV;
varying vec3 vObj;
varying vec3 vTint;
${NOISE}
${ULTRASOUND}
void main(){
  vec3 n = normalize(vN);
  vec3 v = normalize(vV);
  vec3 l = normalize(uLight);
  float wrap = clamp((dot(n, l) + 0.6) / 1.6, 0.0, 1.0);
  float fres = pow(1.0 - clamp(abs(dot(n, v)), 0.0, 1.0), 2.0);
  float fib = snoise(vObj * vec3(1.6, 5.5, 1.6) * uFibre + vec3(uTime * 0.03)) * 0.5 + 0.5;
  float vel = snoise(vObj * 14.0) * 0.5 + 0.5;
  vec3 base = mix(uDeep, uColor, wrap) * vTint;
  base *= 0.84 + 0.2 * fib + 0.06 * vel;
  vec3 c = base + uRim * fres * (0.9 + uGlow);
  c = usShade(c, uEcho, uTime);
  float a = clamp(uOpacity + fres * 0.5, 0.0, 1.0);
  gl_FragColor = vec4(c, a * uFade);
}`;

export function tissueMaterial(o: { color: RGB; deep: RGB; rim: RGB; opacity?: number; fibre?: number; echo?: number; glow?: number; side?: THREE.Side }) {
  const transparent = (o.opacity ?? 1) < 1;
  return new THREE.ShaderMaterial({
    vertexShader: CELL_VERT,
    fragmentShader: TISSUE_FRAG,
    transparent,
    depthWrite: !transparent,
    side: o.side ?? THREE.FrontSide,
    uniforms: {
      uColor: { value: col(o.color) },
      uDeep: { value: col(o.deep) },
      uRim: { value: col(o.rim) },
      uLight: { value: new THREE.Vector3(-0.3, 0.7, 0.8) },
      uOpacity: { value: o.opacity ?? 1 },
      uFibre: { value: o.fibre ?? 1 },
      uEcho: { value: o.echo ?? 0.45 },
      uFade: { value: 1 },
      uGlow: { value: o.glow ?? 0 },
      uDent: { value: 0 },
      uDentDir: { value: new THREE.Vector3(1, 0, 0) },
      uTime: shared.uTime,
      uUS: shared.uUS,
      uProbe: shared.uProbe,
    },
  });
}

// ------------------------------------------------------------------------------------------- backdrop
const QUAD_VERT = /* glsl */ `
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

const BACKDROP_FRAG = /* glsl */ `
uniform vec3 uInner;
uniform vec3 uOuter;
uniform vec3 uGlowColor;
uniform vec2 uCenter;
uniform float uTime;
uniform vec2 uRes;
varying vec2 vUv;
${NOISE}
${ULTRASOUND}
void main(){
  vec2 asp = vec2(uRes.x / uRes.y, 1.0);
  vec2 p = (vUv - uCenter) * asp;
  float r = length(p);
  vec3 c = mix(uInner, uOuter, smoothstep(0.0, 1.15, r));
  float caustic = fbm(vec3(vUv * vec2(2.2, 1.6) * asp, uTime * 0.035)) * 0.5 + 0.5;
  c += uGlowColor * pow(caustic, 3.0) * 0.12 * (1.0 - smoothstep(0.2, 1.2, r));
  float grain = hash12(gl_FragCoord.xy + fract(uTime) * 91.7) - 0.5;
  c += grain * 0.022;
  c = usShade(c, 0.03, uTime);
  gl_FragColor = vec4(c, 1.0);
}`;

export function backdropMaterial(o: { inner: RGB; outer: RGB; glow: RGB; center?: [number, number] }) {
  return new THREE.ShaderMaterial({
    vertexShader: QUAD_VERT,
    fragmentShader: BACKDROP_FRAG,
    depthWrite: false,
    depthTest: false,
    uniforms: {
      uInner: { value: col(o.inner) },
      uOuter: { value: col(o.outer) },
      uGlowColor: { value: col(o.glow) },
      uCenter: { value: new THREE.Vector2(...(o.center ?? [0.62, 0.48])) },
      uTime: shared.uTime,
      uRes: shared.uRes,
      uUS: shared.uUS,
      uProbe: shared.uProbe,
    },
  });
}

/** A full-screen quad that ignores the camera; rendered first, behind everything. */
export function fullscreenQuad(material: THREE.Material) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  mesh.frustumCulled = false;
  mesh.renderOrder = -100;
  return mesh;
}

// ------------------------------------------------------------------------------------------- plate
const PLATE_FRAG = /* glsl */ `
uniform sampler2D uMap;
uniform float uImgAspect;
uniform vec2 uRes;
uniform vec2 uFocus;
uniform vec2 uZoomTo;
uniform float uZoom;
uniform float uPan;
uniform vec2 uPointer;
uniform float uParallax;
uniform float uTime;
uniform float uBloom;
uniform float uSweep;
uniform float uFade;
varying vec2 vUv;
float luma(vec3 c){ return dot(c, vec3(0.299, 0.587, 0.114)); }
float hash(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
void main(){
  float viewAspect = uRes.x / uRes.y;
  float s = viewAspect / uImgAspect;
  vec2 scale = s > 1.0 ? vec2(1.0, 1.0 / s) : vec2(s, 1.0);
  vec2 off = (1.0 - scale) * uFocus;
  vec2 centre = off + 0.5 * scale;
  vec2 c = mix(centre, uZoomTo, uPan);
  vec2 uv = c + (vUv - 0.5) * scale / uZoom;
  // Pseudo-depth from blurred luminance: the backlit background is bright (far), the figure darker (near).
  float depth = 1.0 - luma(textureLod(uMap, uv, 5.5).rgb);
  vec2 drift = vec2(sin(uTime * 0.11), cos(uTime * 0.09)) * 0.35;
  uv += (depth - 0.45) * uParallax * (uPointer + drift) * 0.012;
  uv = clamp(uv, 0.001, 0.999);
  vec3 col = texture2D(uMap, uv).rgb;
  // Warm light sweep across the brighter areas.
  float band = sin(dot(vUv, normalize(vec2(1.0, 0.42))) * 3.2 - uTime * 0.22) * 0.5 + 0.5;
  col += vec3(1.0, 0.9, 0.74) * pow(band, 6.0) * 0.07 * uSweep * smoothstep(0.35, 0.95, luma(col));
  // Gentle bloom toward warm white.
  float l = luma(col);
  col += vec3(1.0, 0.93, 0.84) * l * l * uBloom * 0.9;
  col = mix(col, vec3(1.0, 0.972, 0.93), uBloom * uBloom);
  // Vignette and grain.
  vec2 q = vUv - 0.5;
  col *= 1.0 - dot(q, q) * 0.22;
  col += (hash(gl_FragCoord.xy + fract(uTime) * 61.0) - 0.5) * 0.018;
  gl_FragColor = vec4(col, uFade);
}`;

/** Swap a plate's image and framing in place (used when a phone rotates between wide and tall plates). */
export function setPlateImage(material: THREE.ShaderMaterial, texture: THREE.Texture, focusImg: [number, number], zoomToImg: [number, number]) {
  const img = texture.image as { width: number; height: number };
  const u = material.uniforms;
  const previous = u.uMap.value as THREE.Texture | null;
  u.uMap.value = texture;
  u.uImgAspect.value = img.width / img.height;
  u.uFocus.value.set(focusImg[0], 1 - focusImg[1]);
  u.uZoomTo.value.set(zoomToImg[0], 1 - zoomToImg[1]);
  if (previous && previous !== texture) previous.dispose();
}

/** `focus` and `zoomTo` are given in image coordinates (origin top-left), as measured on the photo. */
export function plateMaterial(texture: THREE.Texture, focusImg: [number, number], zoomToImg: [number, number]) {
  const img = texture.image as { width: number; height: number };
  // Textures are flipped for WebGL, so v runs bottom-up.
  const focus: [number, number] = [focusImg[0], 1 - focusImg[1]];
  const zoomTo: [number, number] = [zoomToImg[0], 1 - zoomToImg[1]];
  return new THREE.ShaderMaterial({
    vertexShader: QUAD_VERT,
    fragmentShader: PLATE_FRAG,
    depthWrite: false,
    depthTest: false,
    transparent: true,
    uniforms: {
      uMap: { value: texture },
      uImgAspect: { value: img.width / img.height },
      uRes: shared.uRes,
      uFocus: { value: new THREE.Vector2(...focus) },
      uZoomTo: { value: new THREE.Vector2(...zoomTo) },
      uZoom: { value: 1 },
      uPan: { value: 0 },
      uPointer: { value: new THREE.Vector2() },
      uParallax: { value: 1 },
      uTime: shared.uTime,
      uBloom: { value: 0 },
      uSweep: { value: 1 },
      uFade: { value: 1 },
    },
  });
}

// ------------------------------------------------------------------------------------------- motes
const MOTE_VERT = /* glsl */ `
attribute vec4 aSeed;
uniform float uTime;
uniform float uSize;
uniform float uPixelRatio;
uniform vec3 uBox;
varying float vAlpha;
void main(){
  vec3 p = position;
  float speed = 0.015 + aSeed.x * 0.035;
  p.y = mod(p.y + uTime * speed * uBox.y + uBox.y * 0.5, uBox.y) - uBox.y * 0.5;
  p.x += sin(uTime * 0.13 + aSeed.y * 6.283) * 0.35 * aSeed.z;
  p.z += cos(uTime * 0.11 + aSeed.y * 4.0) * 0.25 * aSeed.z;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  float size = uSize * (0.35 + aSeed.z);
  gl_PointSize = size * uPixelRatio * (14.0 / max(0.5, -mv.z));
  float tw = 0.35 + 0.65 * abs(sin(uTime * (0.35 + aSeed.w) + aSeed.y * 10.0));
  vAlpha = tw * smoothstep(0.3, 2.5, -mv.z) * (1.0 - smoothstep(uBox.z * 0.7, uBox.z * 1.4, -mv.z));
}`;

const MOTE_FRAG = /* glsl */ `
uniform vec3 uColor;
uniform float uOpacity;
varying float vAlpha;
void main(){
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  float a = smoothstep(0.5, 0.0, d);
  a *= a;
  gl_FragColor = vec4(uColor, a * vAlpha * uOpacity);
}`;

export function motes(o: { count: number; box: [number, number, number]; color: RGB; size?: number; opacity?: number; center?: [number, number, number] }) {
  const g = new THREE.BufferGeometry();
  const pos = new Float32Array(o.count * 3);
  const seed = new Float32Array(o.count * 4);
  const [bx, by, bz] = o.box;
  const [cx, cy, cz] = o.center ?? [0, 0, 0];
  for (let i = 0; i < o.count; i++) {
    pos[i * 3] = cx + (Math.random() - 0.5) * bx;
    pos[i * 3 + 1] = cy + (Math.random() - 0.5) * by;
    pos[i * 3 + 2] = cz + (Math.random() - 0.5) * bz;
    seed[i * 4] = Math.random();
    seed[i * 4 + 1] = Math.random();
    seed[i * 4 + 2] = Math.random() ** 2;
    seed[i * 4 + 3] = Math.random();
  }
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 4));
  const m = new THREE.ShaderMaterial({
    vertexShader: MOTE_VERT,
    fragmentShader: MOTE_FRAG,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: shared.uTime,
      uSize: { value: o.size ?? 3 },
      uPixelRatio: { value: 1 },
      uBox: { value: new THREE.Vector3(bx, by, bz) },
      uColor: { value: col(o.color) },
      uOpacity: { value: o.opacity ?? 1 },
    },
  });
  const points = new THREE.Points(g, m);
  points.frustumCulled = false;
  return points;
}

// ------------------------------------------------------------------------------------------- glow billboards
const GLOW_VERT = /* glsl */ `
uniform float uScale;
varying vec2 vUv;
void main(){
  vUv = uv;
  vec4 mv = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
  mv.xy += position.xy * uScale;
  gl_Position = projectionMatrix * mv;
}`;
const GLOW_FRAG = /* glsl */ `
uniform vec3 uColor;
uniform float uOpacity;
uniform float uCore;
varying vec2 vUv;
void main(){
  float d = length(vUv - 0.5) * 2.0;
  float a = pow(clamp(1.0 - d, 0.0, 1.0), 2.4) + smoothstep(uCore, 0.0, d) * 0.9;
  gl_FragColor = vec4(uColor, a * uOpacity);
}`;

/** Camera-facing soft glow; used for the released egg, the transferred embryo and the heartbeat. */
export function glow(color: RGB, scale = 0.3, core = 0.12) {
  const m = new THREE.ShaderMaterial({
    vertexShader: GLOW_VERT,
    fragmentShader: GLOW_FRAG,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uColor: { value: col(color) }, uOpacity: { value: 1 }, uScale: { value: scale }, uCore: { value: core } },
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), m);
  mesh.frustumCulled = false;
  return mesh;
}

// ------------------------------------------------------------------------------------------- sperm
const SPERM_VERT = /* glsl */ `
attribute float aSeed;
attribute float aAlpha;
attribute float aBeat;
uniform float uTime;
varying float vAlpha;
varying float vHead;
void main(){
  vec3 p = position;
  float w = clamp(-p.x / 0.55, 0.0, 1.0);
  float phase = p.x * 26.0 + uTime * 22.0 * aBeat + aSeed * 6.283;
  p.y += sin(phase) * 0.045 * pow(w, 1.25) * aBeat;
  p.z += cos(phase * 0.9) * 0.018 * pow(w, 1.4) * aBeat;
  vHead = step(-0.03, position.x);
  vAlpha = aAlpha * (1.0 - w * 0.55);
  gl_Position = projectionMatrix * viewMatrix * modelMatrix * instanceMatrix * vec4(p, 1.0);
}`;
const SPERM_FRAG = /* glsl */ `
uniform vec3 uColor;
uniform vec3 uHead;
varying float vAlpha;
varying float vHead;
void main(){
  gl_FragColor = vec4(mix(uColor, uHead, vHead), vAlpha);
}`;

export function spermMaterial() {
  return new THREE.ShaderMaterial({
    vertexShader: SPERM_VERT,
    fragmentShader: SPERM_FRAG,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uTime: shared.uTime, uColor: { value: col("#f2c9cf") }, uHead: { value: col("#fff4f0") } },
  });
}

// ------------------------------------------------------------------------------------------- fabric
const FABRIC_VERT = /* glsl */ `
uniform float uTime;
varying vec2 vUv;
varying vec3 vN;
varying vec3 vV;
${NOISE}
void main(){
  vUv = uv;
  vec3 p = position;
  float t = uTime;
  float n = snoise(vec3(p.x * 0.45, p.y * 0.35, t * 0.09));
  p.z += sin(p.x * 1.1 + t * 0.5) * 0.22 + n * 0.45;
  p.y += sin(p.x * 0.7 + t * 0.35) * 0.08;
  // Finite-difference normal so the folds catch the light.
  float e = 0.05;
  float nx = snoise(vec3((p.x + e) * 0.45, p.y * 0.35, t * 0.09)) - n;
  float ny = snoise(vec3(p.x * 0.45, (p.y + e) * 0.35, t * 0.09)) - n;
  vec3 nrm = normalize(vec3(-nx * 9.0 - cos(p.x * 1.1 + t * 0.5) * 0.24, -ny * 9.0, 1.0));
  vec4 wp = modelMatrix * vec4(p, 1.0);
  vN = normalize(mat3(modelMatrix) * nrm);
  vV = normalize(cameraPosition - wp.xyz);
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const FABRIC_FRAG = /* glsl */ `
uniform float uOpacity;
varying vec2 vUv;
varying vec3 vN;
varying vec3 vV;
void main(){
  float edge = smoothstep(0.0, 0.25, vUv.x) * smoothstep(1.0, 0.6, vUv.x) * smoothstep(0.0, 0.2, vUv.y) * smoothstep(1.0, 0.55, vUv.y);
  float fres = pow(1.0 - clamp(abs(dot(normalize(vN), normalize(vV))), 0.0, 1.0), 1.6);
  vec3 c = mix(vec3(0.99, 0.95, 0.9), vec3(1.0, 0.87, 0.68), fres);
  gl_FragColor = vec4(c, (0.08 + fres * 0.32) * edge * uOpacity);
}`;

export function fabricMaterial() {
  return new THREE.ShaderMaterial({
    vertexShader: FABRIC_VERT,
    fragmentShader: FABRIC_FRAG,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: { uTime: shared.uTime, uOpacity: { value: 1 } },
  });
}
