import * as THREE from "three";
import type { SceneId } from "../story";
import { motes, shared } from "../materials";
import type { AnatomyScene } from "./anatomy";
import { clamp01, frameForCaptions, lerp, Rig, rng, smooth, type Ctx, type Hud, type StoryScene } from "./common";

/**
 * The sculptural mother: a faceless porcelain figure, rendered by raymarching signed distance
 * fields in a fullscreen shader. Over the story she stands with her hands over her abdomen, then
 * the pregnancy grows week by week with the baby visible through a glass window in the belly, and
 * at the close she holds the newborn while leaves (from the Momtree logo) gather around them.
 *
 * The shader writes depth, so the rasterised motes and leaves sit correctly in front of or
 * behind the figure. Sizes follow typical growth: crown-rump length by week, the uterus rising
 * from the pelvis at 12 weeks to below the ribs near term, and the baby turning head-down in the
 * third trimester. It is an illustration, not a model of any patient.
 */

type Key = [number, number];
export type SculptureBeats = {
  id: SceneId;
  /** Gestational age shown, in weeks (0 = not pregnant). Drives the belly, the window and the baby. */
  week: Key[];
  /** How clear the belly window is: 0 porcelain, 1 glass. */
  glass: Key[];
  /** 0 hands resting over the abdomen, 1 cradling the belly, 2 holding the newborn. */
  pose: Key[];
  /** The newborn in her arms, 0..1. */
  baby: Key[];
  /** Soft light that carries the birth transition. */
  bloom: Key[];
  /** Leaves gathering around mother and child at the close, 0..1. */
  leaves: Key[];
  camera: { u: number; pos: number[]; target: number[] }[];
  /** Caption framing: how far the subject sits right of centre on wide screens. */
  shift?: number;
  /** The opening (local units below 10): the camera's way in to her pelvis, before it lands on the anatomy's first view. */
  opening?: { u: number; pos: number[]; target: number[] }[];
  /** How far the x-ray window over the pelvis is open, 0..1, in the opening. */
  xray?: Key[];
  /** The figure dissolving into the anatomy seen through her, 0..1, at the end of the opening. */
  reveal?: Key[];
};

/**
 * Where the anatomy scene's origin (the centre of the uterus) sits inside the figure, and its scale: the anatomy is
 * modelled in centimetres at true size, the figure in metres. Low in the pelvis, behind the pubic bone.
 */
const PELVIS = new THREE.Vector3(0, 0.925, 0.035);
const CM = 0.01;

function keyAt(keys: Key[], u: number) {
  if (!keys.length) return 0;
  if (u <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [u0, v0] = keys[i];
    const [u1, v1] = keys[i + 1];
    if (u <= u1) return lerp(v0, v1, smooth(u0, u1, u));
  }
  return keys[keys.length - 1][1];
}

/** Typical crown-rump length (m) and head radius as a share of it, by gestational week. */
const CRL: Key[] = [
  [10, 0.031],
  [12, 0.055],
  [16, 0.116],
  [20, 0.16],
  [24, 0.21],
  [28, 0.25],
  [32, 0.29],
  [36, 0.32],
  [40, 0.36],
];
const HEAD: Key[] = [
  [10, 0.27],
  [12, 0.25],
  [20, 0.21],
  [28, 0.185],
  [40, 0.17],
];
function table(t: Key[], x: number) {
  if (x <= t[0][0]) return t[0][1];
  for (let i = 0; i < t.length - 1; i++) if (x <= t[i + 1][0]) return lerp(t[i][1], t[i + 1][1], (x - t[i][0]) / (t[i + 1][0] - t[i][0]));
  return t[t.length - 1][1];
}

const QUAD_VERT = /* glsl */ `
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

const FRAG = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform float uTime;
uniform vec2 uRes;
uniform mat4 uInvProj;
uniform mat4 uCamWorld;
uniform mat4 uViewProj;
uniform vec3 uCamPos;
uniform vec3 uBgTop;
uniform vec3 uBgBottom;
uniform vec3 uGlowCol;
uniform vec2 uGlowPos;
uniform mat3 uHeadRot;
uniform vec3 uBellyC;
uniform vec3 uBellyR;
uniform vec3 uShR; uniform vec3 uElR; uniform vec3 uWrR; uniform vec3 uTipR;
uniform vec3 uShL; uniform vec3 uElL; uniform vec3 uWrL; uniform vec3 uTipL;
uniform vec3 uBabyC; uniform mat3 uBabyRot; uniform float uBabyS;
uniform float uGlass; uniform vec3 uWinC;
uniform vec3 uFetusC; uniform mat3 uFetusRot; uniform float uFetusS; uniform float uHeadR;
uniform vec3 uCordA; uniform vec3 uCordB; uniform vec3 uCordC; uniform float uCordR;
uniform vec3 uPlacC; uniform vec3 uPlacR; uniform vec3 uUterC; uniform vec3 uUterR;
uniform float uFetusOn;
uniform float uBloom;
uniform float uPix;
uniform sampler2D uInner;
uniform float uXray;
uniform float uReveal;
uniform vec3 uXrayC;
uniform float uXrayR;

float sdEllipsoid(vec3 p, vec3 r){ float k0 = length(p / r); float k1 = length(p / (r * r)); return k0 * (k0 - 1.0) / max(k1, 1e-6); }
float sdCapsule(vec3 p, vec3 a, vec3 b, float r){ vec3 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0); return length(pa - ba * h) - r; }
float sdRoundCone(vec3 p, vec3 a, vec3 b, float r1, float r2){
  vec3 ba = b - a; float l2 = dot(ba, ba); float rr = r1 - r2; float a2 = l2 - rr * rr; float il2 = 1.0 / l2;
  vec3 pa = p - a; float y = dot(pa, ba); float z = y - l2;
  vec3 xv = pa * l2 - ba * y; float x2 = dot(xv, xv); float y2 = y * y * l2; float z2 = z * z * l2;
  float k = sign(rr) * rr * rr * x2;
  if (sign(z) * a2 * z2 > k) return sqrt(x2 + z2) * il2 - r2;
  if (sign(y) * a2 * y2 < k) return sqrt(x2 + y2) * il2 - r1;
  return (sqrt(x2 * a2 * il2) + y * rr) * il2 - r1;
}
float smin(float a, float b, float k){ float h = max(k - abs(a - b), 0.0) / k; return min(a, b) - h * h * k * 0.25; }

const vec3 NECK_TOP = vec3(0.0, 1.51, 0.012);

float sdHead(vec3 p){
  vec3 q = uHeadRot * (p - NECK_TOP);
  float cranium = sdEllipsoid(q - vec3(0.0, 0.09, 0.0), vec3(0.076, 0.103, 0.091));
  float jaw = sdEllipsoid(q - vec3(0.0, 0.036, 0.036), vec3(0.05, 0.057, 0.058));
  float d = smin(cranium, jaw, 0.04);
  // Featureless but sculpted: a soft brow plane and a small, blended nose, not a lone mannequin bump.
  d = smin(d, sdEllipsoid(q - vec3(0.0, 0.108, 0.074), vec3(0.056, 0.014, 0.022)), 0.022);
  float nose = sdEllipsoid(q - vec3(0.0, 0.074, 0.086), vec3(0.008, 0.017, 0.011));
  return smin(d, nose, 0.02);
}
float sdHair(vec3 p){
  vec3 q = uHeadRot * (p - NECK_TOP);
  float cap = sdEllipsoid(q - vec3(0.0, 0.1, -0.012), vec3(0.082, 0.1, 0.091));
  cap = max(cap, q.z - (0.022 + 0.55 * (q.y - 0.1)));
  // Fine strands carved back towards the bun.
  cap -= 0.0015 * sin(atan(q.x, q.y - 0.02) * 30.0) * smoothstep(0.03, 0.12, q.y);
  float bun = length(q - vec3(0.0, 0.08, -0.104)) - 0.047;
  return smin(cap, bun, 0.026);
}

// x: distance, y: material (0.7 arms, 1 porcelain, 2 hair, 3 swaddle, 3.5 newborn's face)
vec2 mapFigure(vec3 p){
  float d = sdRoundCone(p, vec3(0.0, 0.02, -0.02), vec3(0.0, 0.9, -0.01), 0.3, 0.162);
  float ang = atan(p.z, p.x);
  d += 0.0045 * sin(ang * 13.0 + p.y * 3.0) * smoothstep(0.85, 0.05, p.y);
  d = smin(d, sdEllipsoid(p - vec3(0.0, 0.9, -0.012), vec3(0.168, 0.12, 0.114)), 0.08);
  d = smin(d, sdEllipsoid(p - vec3(0.0, 1.045, 0.0), vec3(0.124, 0.15, 0.088)), 0.08);
  d = smin(d, sdEllipsoid(p - vec3(0.0, 1.235, 0.004), vec3(0.146, 0.168, 0.094)), 0.07);
  // A soft bodice across the chest (no separate bust or cleavage line), a fine neckline, and a
  // pallu draped from her left shoulder across the chest, so she reads as clothed.
  d = smin(d, sdEllipsoid(p - vec3(0.0, 1.222, 0.03), vec3(0.13, 0.06, 0.07)), 0.06);
  vec3 nq = p - vec3(0.0, 1.372, 0.004);
  d = smin(d, length(vec2(length(nq.xz * vec2(1.0, 1.25)) - 0.052, nq.y)) - 0.009, 0.012);
  // The pallu as cloth, not a cord: a thin layer on the torso within a diagonal band (front and
  // back), with a few soft folds, kept above the bump and the window.
  vec3 bn = normalize(vec3(-0.48, 0.88, 0.0));
  float band = abs(dot(p - vec3(0.0, 1.24, 0.0), bn)) - 0.055;
  band = max(band, max(p.y - 1.43, 1.0 - p.y));
  float pallu = max(abs(d - 0.006) - 0.004, band) - 0.0012 * sin(dot(p, bn) * 260.0);
  d = smin(d, pallu, 0.006);
  d = smin(d, sdCapsule(p, vec3(-0.142, 1.358, -0.016), vec3(0.142, 1.358, -0.016), 0.043), 0.065);
  d = smin(d, sdCapsule(p, vec3(0.0, 1.37, -0.005), NECK_TOP, 0.037), 0.045);
  d = smin(d, sdHead(p), 0.03);
  d = smin(d, sdEllipsoid(p - uBellyC, uBellyR), 0.07);
  float aR = sdRoundCone(p, uShR, uElR, 0.035, 0.028);
  aR = smin(aR, sdRoundCone(p, uElR, uWrR, 0.027, 0.02), 0.014);
  aR = smin(aR, sdRoundCone(p, uWrR, uTipR, 0.021, 0.012), 0.011);
  float aL = sdRoundCone(p, uShL, uElL, 0.035, 0.028);
  aL = smin(aL, sdRoundCone(p, uElL, uWrL, 0.027, 0.02), 0.014);
  aL = smin(aL, sdRoundCone(p, uWrL, uTipL, 0.021, 0.012), 0.011);
  float body = d;
  d = smin(d, min(aR, aL), 0.022);
  // Arms and hands weigh 0.7 against the body's 1.0, blended softly, so the belly window fades
  // out along the arm instead of being cut.
  vec2 res = vec2(d, 1.0 - 0.3 * smoothstep(0.004, -0.004, min(aR, aL) - body));
  // The hairline blends into the porcelain rather than switching material.
  float hair = sdHair(p);
  float hw = clamp(0.5 + (res.x - hair) / 0.008, 0.0, 1.0);
  res = vec2(min(res.x, hair), mix(res.y, 2.0, hw));
  if (uBabyS > 0.001) {
    vec3 q = uBabyRot * (p - uBabyC) / uBabyS;
    float sw = sdEllipsoid(q, vec3(0.068, 0.124, 0.066));
    // The hood is open at the front, so a smooth face (no features) shows inside it.
    float hood = sdEllipsoid(q - vec3(0.0, 0.128, -0.012), vec3(0.069, 0.071, 0.066));
    hood = max(hood, -(length(q - vec3(0.0, 0.132, 0.068)) - 0.046));
    float face = length(q - vec3(0.0, 0.132, 0.026)) - 0.05;
    float wrap = smin(sw, hood, 0.03);
    float b = min(wrap, face) * uBabyS;
    if (b < res.x) res = vec2(b, face < wrap ? 3.5 : 3.0);
  }
  return res;
}

// x: distance, y: material (4 baby, 5 placenta, 6 cord, 7 uterine wall)
vec2 mapFetus(vec3 p){
  vec3 q = uFetusRot * (p - uFetusC) / uFetusS;
  float head = length(q - vec3(0.05, 0.36 - (0.22 - uHeadR) * 0.6, 0.0)) - uHeadR;
  float body = sdEllipsoid(q - vec3(0.0, 0.03, 0.0), vec3(0.15, 0.26, 0.13));
  float d = smin(head, body, 0.06);
  vec3 qm = vec3(q.x, q.y, abs(q.z));
  float limbs = sdCapsule(qm, vec3(0.06, 0.19, 0.085), vec3(0.16, 0.09, 0.09), 0.044);
  limbs = smin(limbs, sdCapsule(qm, vec3(0.16, 0.09, 0.09), vec3(0.14, 0.23, 0.06), 0.04), 0.03);
  limbs = min(limbs, sdCapsule(qm, vec3(0.02, -0.17, 0.07), vec3(0.2, 0.0, 0.085), 0.066));
  limbs = smin(limbs, sdCapsule(qm, vec3(0.2, 0.0, 0.085), vec3(0.11, -0.19, 0.075), 0.05), 0.03);
  // Feet tucked in: short and thick, so nothing sticks out of the curl once the baby turns head-down.
  limbs = smin(limbs, sdCapsule(qm, vec3(0.11, -0.19, 0.075), vec3(0.155, -0.215, 0.07), 0.042), 0.03);
  d = smin(d, limbs, 0.05) * uFetusS;
  vec2 res = vec2(d, 4.0);
  float plac = sdEllipsoid(p - uPlacC, uPlacR);
  if (plac < res.x) res = vec2(plac, 5.0);
  // Far half of the uterine wall: the placenta is seen attached to it and the baby inside the uterus.
  float wall = max(abs(sdEllipsoid(p - uUterC, uUterR)) - 0.004, dot(p - uUterC, normalize(uCamPos - uUterC)));
  if (wall < res.x) res = vec2(wall, 7.0);
  float cord = 1e5;
  vec3 prev = uCordA;
  for (int i = 1; i <= 7; i++) {
    float t = float(i) / 7.0;
    vec3 b = mix(mix(uCordA, uCordB, t), mix(uCordB, uCordC, t), t);
    cord = min(cord, sdCapsule(p, prev, b, uCordR));
    prev = b;
  }
  if (cord < res.x) res = vec2(cord, 6.0);
  return res;
}

vec3 figureNormal(vec3 p){
  const vec2 e = vec2(0.0006, -0.0006);
  return normalize(e.xyy * mapFigure(p + e.xyy).x + e.yyx * mapFigure(p + e.yyx).x + e.yxy * mapFigure(p + e.yxy).x + e.xxx * mapFigure(p + e.xxx).x);
}
vec3 fetusNormal(vec3 p){
  const vec2 e = vec2(0.0004, -0.0004);
  return normalize(e.xyy * mapFetus(p + e.xyy).x + e.yyx * mapFetus(p + e.yyx).x + e.yxy * mapFetus(p + e.yxy).x + e.xxx * mapFetus(p + e.xxx).x);
}
float figureAO(vec3 p, vec3 n){
  float occ = 0.0, sca = 1.0;
  for (int i = 0; i < AOS; i++) {
    float h = 0.008 + 0.045 * float(i);
    occ += (h - mapFigure(p + n * h).x) * sca;
    sca *= 0.72;
  }
  return clamp(1.0 - 2.4 * occ, 0.0, 1.0);
}

vec3 background(vec2 uv){
  float ar = uRes.x / uRes.y;
  vec3 c = mix(uBgBottom, uBgTop, smoothstep(0.0, 1.0, uv.y));
  vec2 g = (uv - uGlowPos) * vec2(ar, 1.0);
  c += uGlowCol * 0.5 * exp(-dot(g, g) * 2.6);
  c *= 1.0 - 0.32 * smoothstep(0.45, 1.3, length((uv - 0.5) * vec2(ar, 1.0)));
  return c;
}

vec3 porcelain(vec3 p, vec3 n, vec3 rd, float mat){
  // Porcelain blending into a soft lavender hair glaze; a lavender-tinted cream swaddle and a warm porcelain face.
  vec3 base = mat < 2.5 ? mix(vec3(0.95, 0.92, 0.975), vec3(0.78, 0.71, 0.86), smoothstep(1.0, 2.0, mat)) : (mat < 3.25 ? vec3(0.93, 0.91, 0.98) : vec3(1.0, 0.95, 0.9));
  vec3 L = normalize(vec3(-0.55, 0.75, 0.65));
  vec3 R = normalize(vec3(0.8, 0.3, -0.55));
  float wrap = clamp((dot(n, L) + 0.45) / 1.45, 0.0, 1.0);
  float ao = figureAO(p, n);
  float fres = pow(1.0 - clamp(dot(n, -rd), 0.0, 1.0), 3.0);
  // A tight glaze highlight plus a faint broad sheen.
  float spec = pow(clamp(dot(reflect(rd, n), L), 0.0, 1.0), 140.0);
  float sheen = pow(clamp(dot(reflect(rd, n), L), 0.0, 1.0), 14.0);
  float rim = clamp(dot(n, R), 0.0, 1.0);
  vec3 c = base * (0.2 + 0.92 * wrap) * (0.5 + 0.5 * ao);
  c += vec3(0.3, 0.15, 0.32) * (1.0 - wrap) * 0.32;
  c += vec3(0.8, 0.7, 1.0) * rim * rim * 0.42;
  c += vec3(0.85, 0.8, 1.0) * fres * 0.22;
  c += spec * (mat < 2.5 ? 0.5 : 0.25) + sheen * 0.06;
  return c;
}
vec3 inner(vec3 p, vec3 n, vec3 rd, float mat){
  // Porcelain cream for the baby (no pink or blue), a muted rose placenta, a pearly cord, a mauve uterine wall.
  vec3 base = mat < 4.5 ? vec3(0.97, 0.9, 0.85) : (mat < 5.5 ? vec3(0.74, 0.46, 0.56) : (mat < 6.5 ? vec3(0.92, 0.86, 0.96) : vec3(0.44, 0.34, 0.5)));
  // A high key light with little wrap, so the curled baby's head, back and limbs read as forms.
  vec3 L = normalize(vec3(-0.25, 0.85, 0.45));
  float wrap = clamp((dot(n, L) + 0.3) / 1.3, 0.0, 1.0);
  float fres = pow(1.0 - clamp(dot(n, -rd), 0.0, 1.0), 2.0);
  return base * (0.26 + 0.84 * wrap) + vec3(0.92, 0.86, 1.0) * fres * (mat < 4.5 ? 0.16 : 0.32);
}

vec2 cylinder(vec3 ro, vec3 rd, float r){
  vec2 o = ro.xz; vec2 d = rd.xz;
  float a = dot(d, d); float b = dot(o, d); float c = dot(o, o) - r * r;
  float h = b * b - a * c;
  if (h < 0.0 || a < 1e-8) return vec2(-1.0);
  h = sqrt(h);
  vec2 t = vec2(-b - h, -b + h) / a;
  float y0 = (-0.05 - ro.y) / rd.y; float y1 = (1.86 - ro.y) / rd.y;
  vec2 ty = vec2(min(y0, y1), max(y0, y1));
  return vec2(max(t.x, ty.x), min(t.y, ty.y));
}

void main(){
  // The end of the opening: she has dissolved into the anatomy rendered through her (no need to march the figure).
  if (uReveal > 0.999) {
    gl_FragColor = vec4(texture2D(uInner, vUv).rgb, 1.0);
    gl_FragDepth = 1.0;
    return;
  }
  vec2 ndc = vUv * 2.0 - 1.0;
  vec4 v = uInvProj * vec4(ndc, -1.0, 1.0);
  v /= v.w;
  vec3 rd = normalize((uCamWorld * vec4(v.xyz, 0.0)).xyz);
  vec3 ro = uCamPos;
  vec3 col = background(vUv);
  float depth = 1.0;

  vec2 tb = cylinder(ro, rd, 0.5);
  if (tb.y > max(tb.x, 0.0)) {
    float t = max(tb.x, 0.0);
    float hit = -1.0;
    vec2 res = vec2(0.0);
    float md = 1e5;
    float mt = t;
    for (int i = 0; i < STEPS; i++) {
      vec3 p = ro + rd * t;
      res = mapFigure(p);
      float ang = res.x / max(t, 1e-3);
      if (ang < md) { md = ang; mt = t; }
      if (res.x < 0.0006 * t) { hit = t; break; }
      t += res.x * 0.92;
      if (t > tb.y) break;
    }
    // Rays that only graze the silhouette still get partial coverage, so edges stay smooth. The ramp
    // starts where the hit test ends.
    float cover = hit > 0.0 ? 1.0 : 1.0 - smoothstep(0.0006, 0.0006 + uPix * 1.5, md);
    if (cover > 0.002) {
      float th = hit > 0.0 ? hit : mt;
      vec3 P = ro + rd * th;
      if (hit < 0.0) res = mapFigure(P);
      vec3 n = figureNormal(P);
      vec3 bg = col;
      vec3 body = porcelain(P, n, rd, res.y);
      col = body;
      // Glass window over the uterus: look inside to the baby, cord and placenta. It is wherever the view
      // ray passes through the uterus (its outline as seen from the camera), so the baby is never cut off,
      // even early on when the uterus lies a few centimetres behind the skin. A tight edge, kept above the
      // groin, leaving out the arms, and fading where the belly turns away from view (no glass bowl).
      vec3 uo = (P - uUterC) / (uUterR * 1.05);
      vec3 ud = rd / (uUterR * 1.05);
      float wd = length(uo + ud * max(-dot(uo, ud) / dot(ud, ud), 0.0));
      float facing = smoothstep(0.12, 0.45, dot(n, -rd));
      float win = uGlass * smoothstep(1.03, 0.95, wd) * facing * smoothstep(-0.2, 0.3, dot(n, normalize(P - uWinC))) * smoothstep(0.8, 0.84, P.y) * smoothstep(0.78, 0.98, res.y) * step(res.y, 1.1);
      if (win > 0.003) {
        vec3 amnion = vec3(0.52, 0.44, 0.64); // soft lavender, never wine red
        vec3 seen = amnion + uGlowCol * 0.12;
        if (uFetusOn > 0.5) {
          float ft = 0.002;
          float fh = -1.0;
          vec2 fr = vec2(0.0);
          for (int i = 0; i < FSTEPS; i++) {
            vec3 q = P + rd * ft;
            fr = mapFetus(q);
            if (fr.x < 0.0004) { fh = ft; break; }
            ft += max(fr.x * 0.9, 0.0012);
            if (ft > 0.62) break;
          }
          if (fh > 0.0) {
            vec3 fp = P + rd * fh;
            seen = mix(inner(fp, fetusNormal(fp), rd, fr.y), amnion, smoothstep(0.05, 0.6, fh) * 0.3);
          }
        }
        float fres = pow(1.0 - clamp(dot(n, -rd), 0.0, 1.0), 3.0);
        col = mix(body, seen, win * (1.0 - fres * 0.55));
        col += vec3(0.92, 0.86, 1.0) * fres * win * 0.45;
      }
      // A faint glass rim, so it reads as a window (not on the arms).
      col += vec3(0.95, 0.92, 1.0) * uGlass * smoothstep(0.93, 0.99, wd) * smoothstep(1.05, 0.99, wd) * facing * smoothstep(0.78, 0.98, res.y) * step(res.y, 1.1) * 0.3;
      // The opening's x-ray: within a soft circle around her pelvis (as seen from the camera) the skin turns to glass
      // and the anatomy shows through, rendered from this same camera at true size and place; not on the arms.
      if (uXray > 0.001) {
        vec3 xo = P - uXrayC;
        float xd = length(xo - rd * dot(xo, rd)) / uXrayR;
        float onBody = smoothstep(0.78, 0.98, res.y) * step(res.y, 1.1);
        float xw = uXray * smoothstep(1.0, 0.45, xd) * onBody;
        vec3 inside = texture2D(uInner, vUv).rgb;
        float fr = pow(1.0 - clamp(dot(n, -rd), 0.0, 1.0), 2.5);
        // Glass, not a hole: a little of the porcelain stays in it, most at the grazing edges.
        vec3 glassSkin = mix(inside, body, 0.16 + 0.3 * fr) + vec3(0.86, 0.8, 1.0) * fr * 0.22;
        col = mix(col, glassSkin, xw);
        // A faint glow where porcelain becomes glass.
        col += vec3(0.92, 0.88, 1.0) * uXray * onBody * smoothstep(0.55, 0.85, xd) * smoothstep(1.1, 0.88, xd) * 0.14;
      }
      col = mix(bg, col, cover);
      if (cover > 0.5) {
        vec4 clip = uViewProj * vec4(P, 1.0);
        depth = clamp(clip.z / clip.w * 0.5 + 0.5, 0.0, 1.0);
      }
    }
  }

  vec2 g = (vUv - uGlowPos) * vec2(uRes.x / uRes.y, 1.0);
  // The birth glow: around the pair, not a white-out of the page.
  col = mix(col, vec3(0.97, 0.93, 1.0), uBloom * 0.9 * exp(-dot(g, g) * 1.4));
  float grain = fract(sin(dot(gl_FragCoord.xy + uTime, vec2(12.9898, 78.233))) * 43758.5453);
  col += (grain - 0.5) * 0.014;
  // The figure dissolving into the anatomy seen through her, at the end of the opening.
  if (uReveal > 0.001) col = mix(col, texture2D(uInner, vUv).rgb, uReveal);
  gl_FragColor = vec4(col, 1.0);
  gl_FragDepth = depth;
}`;

const LEAF_VERT = /* glsl */ `
attribute vec4 aLeaf;
uniform float uTime;
uniform float uLeaves;
varying vec2 vUv;
varying float vShade;
varying vec3 vN;
void main(){
  float appear = smoothstep(aLeaf.x, aLeaf.x + 0.32, uLeaves);
  vec3 p = position * appear;
  float f = sin(uTime * (0.6 + aLeaf.y * 0.5) + aLeaf.z * 6.283) * 0.22;
  float c = cos(f), s = sin(f);
  p = vec3(p.x * c - p.z * s, p.y, p.x * s + p.z * c);
  vUv = uv;
  vShade = aLeaf.w;
  vN = normalize(mat3(modelMatrix * instanceMatrix) * vec3(0.0, 0.0, 1.0));
  vec4 wp = modelMatrix * instanceMatrix * vec4(p, 1.0);
  wp.y += sin(uTime * 0.5 + aLeaf.z * 5.0) * 0.006 * appear;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const LEAF_FRAG = /* glsl */ `
uniform vec3 uLeaf;
uniform vec3 uLeafLight;
varying vec2 vUv;
varying float vShade;
varying vec3 vN;
void main(){
  vec3 c = mix(uLeaf * (0.78 + 0.22 * vShade), uLeafLight, smoothstep(0.2, 1.0, vUv.y) * 0.35);
  // Lit from the key light (either face), with a darker midrib.
  float lit = 0.62 + 0.38 * abs(dot(normalize(vN), normalize(vec3(-0.45, 0.75, 0.5))));
  float rib = 1.0 - 0.22 * (1.0 - smoothstep(0.0, 0.03, abs(vUv.x - 0.53))) * smoothstep(0.05, 0.2, vUv.y);
  gl_FragColor = vec4(c * lit * rib, 1.0);
}`;

/** The leaf of the Momtree logo: a rounded leaf with a pointed tip and a notch at the stem. */
function leafGeometry() {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.bezierCurveTo(-0.5, 0.1, -0.52, 0.62, 0.02, 1.05);
  s.bezierCurveTo(0.38, 0.62, 0.46, 0.22, 0.16, 0.06);
  s.lineTo(0.03, 0.36);
  s.lineTo(0, 0);
  const g = new THREE.ShapeGeometry(s, 10);
  g.computeBoundingBox();
  const bb = g.boundingBox!;
  const uv = g.attributes.uv as THREE.BufferAttribute;
  const pos = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (pos.getX(i) - bb.min.x) / (bb.max.x - bb.min.x), (pos.getY(i) - bb.min.y) / (bb.max.y - bb.min.y));
  return g;
}

const v3 = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

export class SculptureScene implements StoryScene {
  id: SceneId;
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(30, 16 / 9, 0.05, 60);
  ready = true;

  private beats: SculptureBeats;
  private rig: Rig;
  private mat: THREE.ShaderMaterial;
  private leafMat: THREE.ShaderMaterial;
  private dust: THREE.Points;
  private tmp = new THREE.Vector3();
  private q = new THREE.Quaternion();
  private m4 = new THREE.Matrix4();
  private fetusWorld = new THREE.Vector3();
  private glassNow = 0;
  // The opening: the anatomy scene, rendered offscreen from this camera (mapped into centimetres) and seen through her.
  private interior?: AnatomyScene;
  private interiorLaidOut = false;
  private innerTarget = new THREE.WebGLRenderTarget(1, 1, { samples: 4 });
  private innerCam = new THREE.PerspectiveCamera(32, 1, 0.05, 2000);
  private landCam = new THREE.PerspectiveCamera(32, 1, 0.05, 200);
  private openRig?: Rig;
  private xrayNow = 0;
  private revealNow = 0;

  constructor(beats: SculptureBeats, tier: "high" | "mid" | "low" = "high") {
    this.id = beats.id;
    this.beats = beats;
    this.rig = new Rig(beats.camera);
    if (beats.opening) this.openRig = new Rig(beats.opening);
    // Raymarch budgets by GPU tier: the figure, the view through the belly window, and occlusion.
    const steps = tier === "high" ? 110 : tier === "mid" ? 84 : 64;
    const fsteps = tier === "low" ? 44 : 56;
    const aos = tier === "high" ? 5 : 3;
    const vec = () => ({ value: new THREE.Vector3() });
    const m3 = () => ({ value: new THREE.Matrix3() });
    this.mat = new THREE.ShaderMaterial({
      vertexShader: QUAD_VERT,
      fragmentShader: FRAG,
      defines: { STEPS: steps, FSTEPS: fsteps, AOS: aos },
      depthTest: true,
      depthWrite: true,
      depthFunc: THREE.AlwaysDepth,
      uniforms: {
        uTime: shared.uTime,
        uRes: shared.uRes,
        uInvProj: { value: new THREE.Matrix4() },
        uCamWorld: { value: new THREE.Matrix4() },
        uViewProj: { value: new THREE.Matrix4() },
        uCamPos: vec(),
        uBgTop: { value: new THREE.Color("#2a1647") },
        uBgBottom: { value: new THREE.Color("#0f0819") },
        uGlowCol: { value: new THREE.Color("#b996ea") },
        uGlowPos: { value: new THREE.Vector2(0.62, 0.55) },
        uHeadRot: m3(),
        uBellyC: vec(),
        uBellyR: vec(),
        uShR: vec(), uElR: vec(), uWrR: vec(), uTipR: vec(),
        uShL: vec(), uElL: vec(), uWrL: vec(), uTipL: vec(),
        uBabyC: vec(),
        uBabyRot: m3(),
        uBabyS: { value: 0 },
        uGlass: { value: 0 },
        uWinC: vec(),
        uFetusC: vec(),
        uFetusRot: m3(),
        uFetusS: { value: 0.1 },
        uHeadR: { value: 0.2 },
        uCordA: vec(), uCordB: vec(), uCordC: vec(),
        uCordR: { value: 0.006 },
        uPlacC: vec(),
        uPlacR: { value: new THREE.Vector3(0.05, 0.01, 0.04) },
        uUterC: vec(), uUterR: vec(),
        uFetusOn: { value: 0 },
        uBloom: { value: 0 },
        uPix: { value: 0.001 },
        uInner: { value: this.innerTarget.texture },
        uXray: { value: 0 },
        uReveal: { value: 0 },
        uXrayC: { value: PELVIS.clone().add(v3(0, 0.008, 0)) },
        uXrayR: { value: 0.1 },
      },
    });
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.mat);
    quad.frustumCulled = false;
    quad.renderOrder = -100;
    this.scene.add(quad);

    this.dust = motes({ count: 120, box: [3.2, 2.6, 2.6], color: "#dccbf3", size: 1.4, opacity: 0.35, center: [0, 1.2, 0] });
    this.scene.add(this.dust);

    // Leaves: mostly above and behind the pair, never in front of the faces.
    const geo = leafGeometry();
    const count = 44;
    this.leafMat = new THREE.ShaderMaterial({
      vertexShader: LEAF_VERT,
      fragmentShader: LEAF_FRAG,
      side: THREE.DoubleSide,
      uniforms: { uTime: shared.uTime, uLeaves: { value: 0 }, uLeaf: { value: new THREE.Color("#80c041") }, uLeafLight: { value: new THREE.Color("#d9f0b8") } },
    });
    const leaves = new THREE.InstancedMesh(geo, this.leafMat, count);
    const attr = new Float32Array(count * 4);
    const r = rng(7);
    const o = new THREE.Object3D();
    // A crown like the logo's canopy: small leaves in an egg-shaped crown around the pair, each
    // pointing outwards, laid out facing the closing camera and set just behind her head.
    const az = -0.37;
    const right = v3(Math.cos(az), 0, -Math.sin(az));
    const back = v3(-Math.sin(az), 0, -Math.cos(az));
    for (let i = 0, placed = 0; placed < count && i < 4000; i++) {
      const a = lerp(-2.3, 2.3, r());
      const rad = lerp(0.22, 0.42, Math.sqrt(r()));
      const lx = Math.sin(a) * rad * 0.95;
      const ly = 1.55 + Math.cos(a) * rad * 0.85;
      if (ly < 1.24) continue;
      const depthOff = 0.1 + r() * 0.1;
      o.position.copy(right).multiplyScalar(lx).add(v3(0, ly, -0.04)).addScaledVector(back, depthOff);
      o.rotation.set((r() - 0.5) * 0.5, az + (r() - 0.5) * 0.6, -a + (r() - 0.5) * 0.45);
      o.scale.setScalar(lerp(0.035, 0.065, r()));
      o.updateMatrix();
      leaves.setMatrixAt(placed, o.matrix);
      attr.set([placed / count * 0.68, r(), r(), r()], placed * 4);
      placed++;
    }
    geo.setAttribute("aLeaf", new THREE.InstancedBufferAttribute(attr, 4));
    leaves.frustumCulled = false;
    this.scene.add(leaves);
  }

  async load() {}

  /** The anatomy scene the opening zooms into: seen through her pelvis, then on screen without a cut. */
  setInterior(scene: AnatomyScene) {
    this.interior = scene;
  }

  layout(ctx: Ctx) {
    (this.dust.material as THREE.ShaderMaterial).uniforms.uPixelRatio.value = ctx.dpr;
    this.innerTarget.setSize(Math.max(1, Math.round(ctx.width * ctx.dpr)), Math.max(1, Math.round(ctx.height * ctx.dpr)));
    this.interiorLaidOut = false;
  }

  beforeRender(renderer: THREE.WebGLRenderer, ctx: Ctx) {
    const a = this.interior;
    if (!a || (this.xrayNow < 0.002 && this.revealNow < 0.002)) return;
    if (!this.interiorLaidOut) {
      a.layout(ctx);
      this.interiorLaidOut = true;
    }
    // The anatomy as it is at its first frame, seen from this camera: same lens and framing, position in centimetres.
    a.update(0, 0, ctx);
    const c = this.camera;
    const ic = this.innerCam;
    ic.fov = c.fov;
    ic.aspect = c.aspect;
    if (c.view?.enabled) ic.setViewOffset(c.view.fullWidth, c.view.fullHeight, c.view.offsetX, c.view.offsetY, c.view.width, c.view.height);
    else ic.clearViewOffset();
    ic.updateProjectionMatrix();
    ic.position.copy(c.position).sub(PELVIS).divideScalar(CM);
    ic.quaternion.copy(c.quaternion);
    ic.updateMatrixWorld();
    const prev = renderer.getRenderTarget();
    renderer.setRenderTarget(this.innerTarget);
    renderer.clear();
    renderer.render(a.scene, ic);
    renderer.setRenderTarget(prev);
  }

  update(u: number, _dt: number, ctx: Ctx) {
    const b = this.beats;
    const U = this.mat.uniforms;
    const week = keyAt(b.week, u);
    const pose = keyAt(b.pose, u);
    const babyIn = keyAt(b.baby, u);
    this.glassNow = keyAt(b.glass, u);
    U.uGlass.value = this.glassNow;
    U.uBloom.value = keyAt(b.bloom, u);
    this.leafMat.uniforms.uLeaves.value = keyAt(b.leaves, u);
    // The opening (below local unit 10; the story never reaches 10 in that slot, and the pregnancy starts at 10).
    const opening = u < 10;
    this.xrayNow = opening && b.xray ? keyAt(b.xray, u) : 0;
    this.revealNow = opening && b.reveal ? keyAt(b.reveal, u) : 0;
    U.uXray.value = this.xrayNow;
    U.uReveal.value = this.revealNow;
    // The glass spreads from her pelvis, then over her whole body as she dissolves.
    U.uXrayR.value = lerp(0.085, 0.2, smooth(5.0, 7.4, u)) + 0.55 * smooth(7.4, 9.0, u);
    (this.dust.material as THREE.ShaderMaterial).uniforms.uOpacity.value = 0.35 * (1 - this.revealNow);

    // Belly and uterus by week (the uterus rises from the pelvis to just below the ribs).
    const g = smooth(12, 38, week);
    const bellyC = v3(0, lerp(0.95, 1.01, g), lerp(0.02, 0.16, g));
    const bellyR = v3(lerp(0.09, 0.165, g), lerp(0.09, 0.2, g), lerp(0.06, 0.17, g));
    U.uBellyC.value.copy(bellyC);
    U.uBellyR.value.copy(bellyR);
    const w = clamp01((week - 10) / 30);
    const uterusC = v3(0, lerp(0.86, 1.03, smooth(0, 1, w)), lerp(0.05, 0.13, w));
    const uterusR = v3(lerp(0.055, 0.15, w), lerp(0.06, 0.19, w), lerp(0.045, 0.15, w));
    // Centre of the glass window (the shader keeps it to the side of the body facing this point): the uterus,
    // then the bump once it shows.
    U.uWinC.value.copy(uterusC).add(v3(0, 0, uterusR.z * 0.35)).lerp(bellyC.clone().add(v3(0, 0, bellyR.z * 0.2)), smooth(0.15, 0.45, g));

    // The baby inside: crown-rump length by week, turning head-down in the third trimester.
    const fetusOn = week >= 10 ? 1 : 0;
    U.uFetusOn.value = fetusOn;
    const crl = table(CRL, week);
    // Drawn at `crl` the model is only 74-86% of the CRL table with a mid-pregnancy head-to-body ratio. Grow the body
    // with the weeks while keeping the head its true size, so the baby matches its week and fills the uterus near term.
    const k = lerp(1.15, 1.35, smooth(12, 40, week));
    U.uFetusS.value = crl * k;
    U.uHeadR.value = table(HEAD, week) / k;
    const turn = lerp(0.35, Math.PI - 0.3, smooth(22, 31, week));
    this.q.setFromEuler(new THREE.Euler(0, -1.0, turn, "YXZ"));
    const fetusC = uterusC.clone().add(v3(0, -0.01, -uterusR.z * 0.08));
    this.fetusWorld.copy(fetusC);
    U.uFetusC.value.copy(fetusC);
    this.m4.makeRotationFromQuaternion(this.q.clone().invert());
    U.uFetusRot.value.setFromMatrix4(this.m4);
    const navel = v3(0.13, -0.05, 0).multiplyScalar(crl * k).applyQuaternion(this.q).add(fetusC);
    const plac = uterusC.clone().add(v3(uterusR.x * 0.1, uterusR.y * 0.62, -uterusR.z * 0.55));
    U.uPlacC.value.copy(plac);
    U.uPlacR.value.set(uterusR.x * 0.62, uterusR.y * 0.12 + 0.006, uterusR.z * 0.46);
    U.uUterC.value.copy(uterusC);
    U.uUterR.value.copy(uterusR);
    U.uCordA.value.copy(navel);
    U.uCordC.value.copy(plac).add(v3(0, -uterusR.y * 0.08, uterusR.z * 0.12));
    // Bow towards the viewer so the whole cord, navel to placenta, is seen.
    U.uCordB.value.copy(navel).add(plac).multiplyScalar(0.5).add(v3(-uterusR.x * 0.6, -uterusR.y * 0.1, uterusR.z * 0.6));
    U.uCordR.value = lerp(0.0035, 0.008, w);

    // Arms: blend three poses. Pose 1 follows the belly so the hands rest on it.
    const sh = { r: v3(-0.162, 1.352, -0.012), l: v3(0.162, 1.352, -0.012) };
    const poses = [
      // Hands resting together at the waist, clear of the pelvis the opening zooms into.
      { el: [v3(-0.215, 1.12, 0.02), v3(0.215, 1.1, 0.02)], wr: [v3(-0.06, 1.035, 0.112), v3(0.055, 1.015, 0.108)], tip: [v3(0.02, 1.02, 0.124), v3(-0.025, 1.0, 0.12)] },
      {
        el: [v3(-0.225, 1.12, 0.05 + 0.25 * bellyR.z), v3(0.225, 0.99, 0.03 + 0.2 * bellyR.z)],
        wr: [bellyC.clone().add(v3(-0.08, bellyR.y * 0.42, bellyR.z * 0.97 + 0.03)), bellyC.clone().add(v3(0.09, -bellyR.y * 0.6, bellyR.z * 0.9 + 0.028))],
        tip: [bellyC.clone().add(v3(0.0, bellyR.y * 0.5, bellyR.z * 1.0 + 0.024)), bellyC.clone().add(v3(0.0, -bellyR.y * 0.72, bellyR.z * 0.94 + 0.022))],
      },
      { el: [v3(-0.19, 1.04, 0.11), v3(0.205, 1.1, 0.04)], wr: [v3(0.0, 1.075, 0.245), v3(0.12, 1.215, 0.165)], tip: [v3(0.09, 1.1, 0.24), v3(0.065, 1.265, 0.205)] },
    ];
    const pa = Math.min(1, Math.floor(pose));
    const pt = smooth(0, 1, pose - pa);
    const P0 = poses[pa];
    const P1 = poses[Math.min(2, pa + 1)];
    const blend = (a: THREE.Vector3, c: THREE.Vector3, out: THREE.Vector3) => out.copy(a).lerp(c, pt);
    U.uShR.value.copy(sh.r);
    U.uShL.value.copy(sh.l);
    blend(P0.el[0], P1.el[0], U.uElR.value);
    blend(P0.el[1], P1.el[1], U.uElL.value);
    blend(P0.wr[0], P1.wr[0], U.uWrR.value);
    blend(P0.wr[1], P1.wr[1], U.uWrL.value);
    blend(P0.tip[0], P1.tip[0], U.uTipR.value);
    blend(P0.tip[1], P1.tip[1], U.uTipL.value);

    // Head: looking down at her hands, then at the baby.
    const tilt = lerp(lerp(0.2, 0.34, clamp01(pose)), 0.4, clamp01(pose - 1));
    const look = lerp(0, 0.22, clamp01(pose - 1));
    this.m4.makeRotationFromEuler(new THREE.Euler(tilt, look, 0.06, "YXZ")).invert();
    U.uHeadRot.value.setFromMatrix4(this.m4);

    // The newborn lies diagonally across her chest, head towards her left shoulder.
    U.uBabyS.value = babyIn > 0.001 ? lerp(0.85, 1, babyIn) : 0;
    const breathe = Math.sin(shared.uTime.value * 1.4) * 0.002;
    U.uBabyC.value.set(0.035, 1.165 + breathe, 0.172);
    const ay = v3(0.62, 0.58, 0.18).normalize();
    const az = v3(-0.05, 0.12, 1).normalize();
    const ax = new THREE.Vector3().crossVectors(ay, az).normalize();
    az.crossVectors(ax, ay).normalize();
    this.m4.makeBasis(ax, ay, az).invert();
    U.uBabyRot.value.setFromMatrix4(this.m4);

    // Camera. In the opening it moves in to her pelvis and lands on exactly the anatomy scene's first view (its lens,
    // framing and position, mapped into metres), so the story can change scene there without a cut.
    const shift = b.shift ?? 0.14;
    if (opening && this.openRig && this.interior) {
      const ease = smooth(6.4, 10, u);
      this.camera.fov = lerp(30, this.interior.camera.fov, ease);
      frameForCaptions(this.camera, ctx, lerp(shift, 0.23, ease));
      this.openRig.apply(this.camera, Math.min(u, 8.2), ctx, 0.03, true);
      const land = smooth(8.2, 10, u);
      if (land > 0) {
        this.interior.openingCamera(ctx, this.landCam);
        const from = this.camera.position.clone();
        const fromT = this.tmp.fromArray(this.openRig.target.at(8.2));
        const toT = this.interior.openingTarget().multiplyScalar(CM).add(PELVIS);
        const to = this.landCam.position.clone().multiplyScalar(CM).add(PELVIS);
        this.camera.position.copy(from.lerp(to, land));
        this.camera.lookAt(fromT.lerp(toT, land));
      }
    } else {
      this.camera.fov = 30;
      this.rig.apply(this.camera, u, ctx, 0.03, true);
      frameForCaptions(this.camera, ctx, shift);
    }
    this.camera.updateMatrixWorld();
    U.uInvProj.value.copy(this.camera.projectionMatrixInverse);
    U.uCamWorld.value.copy(this.camera.matrixWorld);
    U.uViewProj.value.multiplyMatrices(this.camera.projectionMatrix, this.camera.matrixWorldInverse);
    U.uCamPos.value.copy(this.camera.position);
    U.uPix.value = (2 * Math.tan((this.camera.fov * Math.PI) / 360)) / Math.max(1, ctx.height * ctx.dpr);
    const glow = this.tmp.set(0, 1.15, 0).project(this.camera);
    U.uGlowPos.value.set(glow.x * 0.5 + 0.5, glow.y * 0.5 + 0.5);
  }

  hud(): Hud {
    return { labels: [{ id: "fetusW", pos: this.fetusWorld, a: this.glassNow > 0.6 ? clamp01((this.glassNow - 0.6) * 4) : 0 }], scale: null };
  }

  dispose() {
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      m.geometry?.dispose();
      (m.material as THREE.Material | undefined)?.dispose?.();
    });
    this.innerTarget.dispose();
  }
}
