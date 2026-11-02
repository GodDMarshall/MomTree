"use client";

import Image, { getImageProps } from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { captions, chapters, labelText, panels, plateBest, plates, toneAt, veilAt, type Panel } from "@/lib/life/story";
import type { FrameInfo, LifeEngine } from "@/lib/life/engine";
import type { StoryAudio } from "@/lib/life/audio";
import { whatsappLink } from "@/lib/site";
import { ArrowDown, ArrowRight } from "@/components/ui/Icons";
import { rich, plain } from "./rich";
import "./life.css";

type Mode = "immersive" | "static";

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const sstep = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const isPortrait = () => window.innerWidth / window.innerHeight < 0.85;
const panelTone = (p: Panel) => toneAt(Math.max(0, p.from + 0.01));

declare global {
  interface Window {
    __life?: LifeEngine;
  }
}

/**
 * Life Unfolds: the scroll-driven story at the top of the home page. The visual layer is a single
 * WebGL canvas (loaded after first paint); every word lives in the HTML so it is readable,
 * indexable and translatable. A complete static version takes over for reduced motion, Save-Data
 * and devices without WebGL2.
 */
export function LifeUnfolds() {
  const [mode, setMode] = useState<Mode>("immersive");
  const [ready, setReady] = useState(false);
  const [chaptersOpen, setChaptersOpen] = useState(false);

  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const veilRef = useRef<HTMLDivElement>(null);
  const panelEls = useRef(new Map<string, HTMLElement>());
  const labelEls = useRef(new Map<string, HTMLElement>());
  const ringEls = useRef<(SVGCircleElement | null)[]>([]);
  const capWrap = useRef<HTMLDivElement>(null);
  const capFig = useRef<HTMLSpanElement>(null);
  const capText = useRef<HTMLSpanElement>(null);
  const capDay = useRef<HTMLSpanElement>(null);
  const scaleEl = useRef<HTMLDivElement>(null);
  const scaleBar = useRef<HTMLSpanElement>(null);
  const scaleLabel = useRef<HTMLSpanElement>(null);
  const chNum = useRef<HTMLSpanElement>(null);
  const chTitle = useRef<HTMLSpanElement>(null);
  const skipEl = useRef<HTMLAnchorElement>(null);
  const audio = useRef<StoryAudio | null>(null);
  const state = useRef({ tone: "", caption: -2, chapter: -1, active: false });

  // ----------------------------------------------------------------------------- mode
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (reduce || conn?.saveData) setMode("static");
  }, []);

  // ----------------------------------------------------------------------------- per-frame UI
  const apply = useCallback((u: number, frame?: FrameInfo) => {
    const s = state.current;
    const stage = stageRef.current;
    if (!stage) return;

    const v = veilAt(u);
    if (veilRef.current) {
      veilRef.current.style.opacity = v.opacity.toFixed(3);
      veilRef.current.style.backgroundColor = `rgb(${v.color.join(",")})`;
    }

    const tone = toneAt(u);
    if (tone !== s.tone) {
      s.tone = tone;
      stage.dataset.tone = tone;
      if (s.active) document.documentElement.dataset.tone = tone;
    }

    for (const p of panels) {
      const el = panelEls.current.get(p.id);
      if (!el) continue;
      const fadeIn = p.from < 0 ? 1 : sstep(p.from, p.from + 1.1, u);
      const fadeOut = 1 - sstep(p.to - 1.1, p.to, u);
      const vis = Math.min(fadeIn, fadeOut);
      const dir = u < (p.from + p.to) / 2 ? 1 : -1;
      el.style.opacity = vis.toFixed(3);
      el.style.setProperty("--py", `${((1 - vis) * 28 * dir).toFixed(1)}px`);
      el.style.visibility = vis < 0.01 ? "hidden" : "visible";
    }

    let ci = -1;
    for (let i = 0; i < captions.length; i++) if (u >= captions[i].from && u < captions[i].to) ci = i;
    if (ci !== s.caption) {
      s.caption = ci;
      if (ci >= 0) {
        const c = captions[ci];
        if (capFig.current) capFig.current.textContent = c.fig;
        if (capText.current) capText.current.textContent = c.text;
        if (capDay.current) capDay.current.textContent = c.day ?? "";
      }
    }
    if (capWrap.current) {
      const c = ci >= 0 ? captions[ci] : null;
      capWrap.current.style.opacity = c ? Math.min(sstep(c.from, c.from + 0.6, u), 1 - sstep(c.to - 0.6, c.to, u)).toFixed(3) : "0";
    }

    let chi = 0;
    chapters.forEach((c, i) => {
      if (u >= c.from) chi = i;
      const ring = ringEls.current[i];
      if (ring) ring.style.strokeDashoffset = (1 - clamp01((u - c.from) / (c.to - c.from))).toFixed(4);
    });
    if (chi !== s.chapter) {
      s.chapter = chi;
      if (chNum.current) chNum.current.textContent = String(chapters[chi].n).padStart(2, "0");
      if (chTitle.current) chTitle.current.textContent = chapters[chi].title;
    }

    // Labels and the true-to-scale bar come from the 3D camera.
    const seen = new Set<string>();
    frame?.labels.forEach((l) => {
      const el = labelEls.current.get(l.id);
      if (!el) return;
      seen.add(l.id);
      // Keep labels on screen: one anchored near the right edge would otherwise run off it.
      const x = Math.min(l.x, window.innerWidth - el.offsetWidth - 12);
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${l.y.toFixed(1)}px, 0)`;
      el.style.opacity = l.a.toFixed(3);
    });
    labelEls.current.forEach((el, id) => {
      if (!seen.has(id)) el.style.opacity = "0";
    });
    if (scaleEl.current) {
      const sc = frame?.scale;
      if (sc && sc.px > 4) {
        scaleEl.current.style.opacity = sc.a.toFixed(3);
        if (scaleBar.current) scaleBar.current.style.width = `${sc.px.toFixed(1)}px`;
        if (scaleLabel.current && scaleLabel.current.textContent !== sc.label) scaleLabel.current.textContent = sc.label;
      } else scaleEl.current.style.opacity = "0";
    }

    if (skipEl.current) skipEl.current.style.opacity = (1 - sstep(94, 96.5, u)).toFixed(3);
  }, []);

  // ----------------------------------------------------------------------------- engine + scroll
  useEffect(() => {
    if (mode !== "immersive") return;
    gsap.registerPlugin(ScrollTrigger);
    const section = sectionRef.current!;
    const html = document.documentElement;
    let engine: LifeEngine | undefined;
    let disposed = false;

    // Derived from progress rather than toggle events: GSAP fires no toggle when a jump (scrollbar
    // drag, find in page, restored scroll) crosses the whole section, which used to leave it stuck.
    const setActive = (on: boolean) => {
      state.current.active = on;
      html.dataset.immersive = String(on);
      html.dataset.tone = on ? state.current.tone || "dark" : "light";
      audio.current?.setPresence(on);
      engine?.setVisible(on);
    };
    const st = ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => {
        const u = self.progress * 100;
        if (engine) engine.setProgress(u);
        else apply(u);
        audio.current?.setProgress(u);
        const on = self.progress < 1;
        if (on !== state.current.active) setActive(on);
      },
      onLeave: () => setActive(false),
      onEnterBack: () => setActive(true),
    });
    setActive(st.progress < 1);
    apply(st.progress * 100);

    const boot = async () => {
      const mod = await import("@/lib/life/engine");
      if (disposed) return;
      if (!mod.supportsWebGL2()) {
        setMode("static");
        return;
      }
      const posterMode = new URLSearchParams(location.search).has("posters");
      // Poster capture always renders at full quality (4K with a 2× device pixel ratio).
      const tier = posterMode ? "high" : mod.detectTier();
      engine = new mod.LifeEngine(canvasRef.current!, { tier, portrait: isPortrait(), preserveDrawingBuffer: posterMode });
      engine.onFrame = (f) => apply(f.u, f);
      engine.onLost = () => setMode("static");
      engine.jumpTo(st.progress * 100);
      await engine.start();
      if (disposed) {
        engine.dispose();
        return;
      }
      engine.setVisible(st.isActive || st.progress < 0.001);
      window.__life = engine;
      setReady(true);
    };
    const ric = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
    const kick = () => boot().catch(() => setMode("static"));
    if (ric) ric(kick, { timeout: 900 });
    else setTimeout(kick, 200);

    let resizeT = 0;
    const onResize = () => {
      window.clearTimeout(resizeT);
      resizeT = window.setTimeout(() => {
        engine?.setPortrait(isPortrait());
        ScrollTrigger.refresh();
      }, 150);
    };
    window.addEventListener("resize", onResize);

    return () => {
      disposed = true;
      st.kill();
      window.removeEventListener("resize", onResize);
      engine?.dispose();
      window.__life = undefined;
      delete html.dataset.immersive;
      html.dataset.tone = "light";
    };
  }, [mode, apply]);

  useEffect(() => () => audio.current?.dispose(), []);

  // ----------------------------------------------------------------------------- navigation within the story
  const scrollToUnit = (u: number) => {
    const section = sectionRef.current;
    if (!section) return;
    const top = section.getBoundingClientRect().top + window.scrollY;
    const y = top + (u / 100) * (section.offsetHeight - window.innerHeight);
    if (window.__lenis) window.__lenis.scrollTo(y, { duration: 2.2 });
    else window.scrollTo({ top: y, behavior: "smooth" });
    setChaptersOpen(false);
  };

  // ============================================================================= static version
  if (mode === "static") return <StaticStory />;

  // ============================================================================= immersive version
  return (
    <section ref={sectionRef} id="life-unfolds" className="life" aria-labelledby="life-h1">
      <div className="sr-only">
        <h2>Life Unfolds: the journey from fertility to a new beginning</h2>
        <p>An illustrated, scroll-driven story. Illustrations are educational and do not show actual patients or outcomes.</p>
        <ol>
          {panels
            .filter((p) => p.cta !== "hero" && p.cta !== "final")
            .map((p) => (
              <li key={p.id}>
                {p.heading && <strong>{plain(p.heading)} </strong>}
                {p.body.join(" ")}
              </li>
            ))}
        </ol>
      </div>

      <div ref={stageRef} className="life-stage" data-tone={toneAt(0)}>
        {/* First paint: the opening plate as a real image, so the hero never waits for WebGL. */}
        <HeroPicture />
        <canvas ref={canvasRef} className={`life-canvas ${ready ? "is-ready" : ""}`} aria-hidden="true" />
        <div ref={veilRef} className="life-veil" aria-hidden="true" />
        <div className="life-scrim" aria-hidden="true" />
        <div className="life-grain grain" aria-hidden="true" />

        {/* Anatomical labels positioned by the 3D camera */}
        <div className="absolute inset-0 z-[3] overflow-hidden" aria-hidden="true">
          {Object.entries(labelText).map(([id, text]) => (
            <span
              key={id}
              ref={(el) => {
                if (el) labelEls.current.set(id, el);
              }}
              className="life-label"
              style={{ opacity: 0 }}
            >
              <i />
              {text}
            </span>
          ))}
        </div>

        {/* Captions */}
        {panels.map((p) => (
          <article
            key={p.id}
            ref={(el) => {
              if (el) panelEls.current.set(p.id, el);
            }}
            className="life-panel"
            data-kind={p.cta ?? "chapter"}
            data-ptone={panelTone(p)}
            aria-hidden={p.cta ? undefined : true}
            style={{ opacity: p.from < 0 ? 1 : 0 }}
          >
            {p.label && <p className="life-eyebrow">{p.cta === "hero" ? p.label : `${String(p.chapter).padStart(2, "0")} · ${p.label}`}</p>}
            {p.heading &&
              (p.level === 1 ? (
                <h1 id="life-h1" className="t-hero mt-5">
                  {rich(p.heading)}
                </h1>
              ) : p.cta === "final" ? (
                <h2 className="t-display mt-4">{rich(p.heading)}</h2>
              ) : p.level === 2 ? (
                <h2 className="life-h2 mt-4">{rich(p.heading)}</h2>
              ) : (
                <h3 className="life-h3 mt-2">{rich(p.heading)}</h3>
              ))}
            {p.body.map((b, i) => (
              <p key={i} className={p.cta ? "life-lede mt-6" : "life-body mt-4"}>
                {b}
              </p>
            ))}
            {p.cta === "hero" && (
              <div className="mt-9 flex flex-wrap gap-3">
                <button type="button" className="btn btn-leaf" onClick={() => scrollToUnit(chapters[1].anchor)}>
                  Begin the story <ArrowDown className="h-4 w-4" />
                </button>
                <Link href="/contact#appointment" className="btn btn-light">
                  Book a consultation
                </Link>
              </div>
            )}
            {p.cta === "final" && (
              <div className="mt-9 flex flex-wrap gap-3">
                <Link href="/contact#appointment" className="btn btn-leaf">
                  Begin your journey <ArrowRight />
                </Link>
                <a href={whatsappLink("Hello Momtree IVF, I would like to speak with your fertility specialist.")} target="_blank" rel="noopener noreferrer" className="btn btn-light">
                  Talk to our fertility specialist
                </a>
              </div>
            )}
          </article>
        ))}

        {/* Figure caption, day counter, scale bar */}
        <div ref={capWrap} className="life-caption" style={{ opacity: 0 }} aria-hidden="true">
          <span ref={capFig} className="life-fig" />
          <span ref={capText} className="life-captext" />
          <span ref={capDay} className="life-day" />
          <div ref={scaleEl} className="life-scale" style={{ opacity: 0 }}>
            <span ref={scaleBar} className="life-scale-bar" />
            <span ref={scaleLabel} className="life-scale-label" />
          </div>
          <span className="life-illus">Illustrative visualisation · not an individual outcome</span>
        </div>

        {/* Bottom HUD: growth rings + chapter, skip, sound */}
        <div className="life-hud">
          <div className="relative">
            <button
              type="button"
              className="life-rings"
              aria-expanded={chaptersOpen}
              aria-controls="life-chapters"
              onClick={() => setChaptersOpen((o) => !o)}
              aria-label="Story chapters"
            >
              <svg viewBox="0 0 64 64" aria-hidden="true">
                {chapters.map((c, i) => (
                  <g key={c.id}>
                    <circle cx="32" cy="32" r={6 + i * 3.9} pathLength={1} className="life-ring-base" />
                    <circle
                      ref={(el) => {
                        ringEls.current[i] = el;
                      }}
                      cx="32"
                      cy="32"
                      r={6 + i * 3.9}
                      pathLength={1}
                      className="life-ring"
                      transform={`rotate(${-90 + i * 26} 32 32)`}
                    />
                  </g>
                ))}
              </svg>
              <span className="flex flex-col items-start text-left leading-none">
                <span ref={chNum} className="font-serif text-[1.7rem] italic">01</span>
                <span ref={chTitle} className="mt-1 hidden text-[10px] font-semibold uppercase tracking-[0.22em] opacity-80 sm:block">
                  The beginning
                </span>
              </span>
            </button>
            <ol id="life-chapters" className={`life-chapters ${chaptersOpen ? "is-open" : ""}`}>
              {chapters.map((c) => (
                <li key={c.id}>
                  <button type="button" onClick={() => scrollToUnit(c.anchor)} tabIndex={chaptersOpen ? 0 : -1}>
                    <span className="font-serif italic text-violet">{String(c.n).padStart(2, "0")}</span> {c.title}
                  </button>
                </li>
              ))}
            </ol>
          </div>

          <a
            ref={skipEl}
            href="#welcome"
            className="life-skip"
            onClick={(e) => {
              const el = document.getElementById("welcome");
              if (el && window.__lenis) {
                e.preventDefault();
                window.__lenis.scrollTo(el, { duration: 1.6 });
              }
            }}
          >
            <span className="hidden sm:inline">Skip the story</span>
            <span className="sm:hidden">Skip</span> <ArrowDown className="h-3.5 w-3.5" />
          </a>

          <SoundControl audio={audio} />
        </div>
      </div>
    </section>
  );
}

// =============================================================================================
const HERO_ALT = "A pregnant woman in soft afternoon light, her hands resting on her belly";
const SCULPTURE_ALT = "A porcelain sculpture of a woman, her hands resting over her abdomen, on a deep purple background";
const pos = (f: [number, number]) => `${Math.round(f[0] * 100)}% ${Math.round(f[1] * 100)}%`;

/**
 * The opening frame of the 3D story, rendered ahead of time (scripts/capture-posters.mjs), so the
 * hero shows the sculpture at once and never waits for WebGL: a portrait render on tall screens,
 * and up to 4K on large, dense displays. The live canvas fades in over it.
 */
function HeroPicture() {
  const common = { alt: SCULPTURE_ALT, sizes: "100vw", quality: 82, fetchPriority: "high", loading: "eager" } as const;
  const w = getImageProps({ ...common, src: "/story/posters/hero.webp", width: 3840, height: 2160 }).props;
  const t = getImageProps({ ...common, src: "/story/posters/hero-tall.webp", width: 1560, height: 3376 }).props;
  return (
    <picture className="life-hero-img absolute inset-0" style={{ ["--pos-wide" as string]: "50% 50%", ["--pos-tall" as string]: "50% 50%" }}>
      <source media="(max-aspect-ratio: 17/20)" srcSet={t.srcSet} sizes="100vw" />
      {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
      <img {...w} className="h-full w-full object-cover" />
    </picture>
  );
}

// =============================================================================================
function SoundControl({ audio }: { audio: React.RefObject<StoryAudio | null> }) {
  const [on, setOn] = useState(false);
  const [volume, setVolume] = useState(0.6);
  const [calm, setCalm] = useState(false);
  const [busy, setBusy] = useState(false);

  const toggle = async () => {
    if (busy) return;
    if (!on) {
      setBusy(true);
      try {
        if (!audio.current) {
          const { StoryAudio } = await import("@/lib/life/audio");
          audio.current = new StoryAudio();
          audio.current.setVolume(volume);
          audio.current.setCalm(calm);
          const st = ScrollTrigger.getAll().find((t) => (t.trigger as Element | undefined)?.id === "life-unfolds");
          audio.current.setProgress((st?.progress ?? 0) * 100);
        }
        await audio.current.enable();
        setOn(true);
      } finally {
        setBusy(false);
      }
    } else {
      audio.current?.disable();
      setOn(false);
    }
  };

  return (
    <div className={`life-sound ${on ? "is-on" : ""}`}>
      <button type="button" onClick={toggle} aria-pressed={on} className="life-sound-btn" aria-label={on ? "Turn sound off" : "Turn sound on"}>
        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.4">
          <path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4Z" strokeLinejoin="round" />
          {on ? (
            <>
              <path d="M15.5 9a4 4 0 0 1 0 6" strokeLinecap="round" />
              <path d="M18 6.5a7.5 7.5 0 0 1 0 11" strokeLinecap="round" />
            </>
          ) : (
            <path d="m16 9.5 5 5m0-5-5 5" strokeLinecap="round" />
          )}
        </svg>
        <span className="text-[10.5px] font-semibold uppercase tracking-[0.2em]">{on ? "Sound on" : "Sound off"}</span>
      </button>
      {on && (
        <div className="life-sound-panel">
          <label className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.16em]">
            <span className="sr-only sm:not-sr-only">Volume</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              aria-label="Volume"
              onChange={(e) => {
                const v = Number(e.target.value);
                setVolume(v);
                audio.current?.setVolume(v);
              }}
            />
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.16em]">
            <input
              type="checkbox"
              checked={calm}
              onChange={(e) => {
                setCalm(e.target.checked);
                audio.current?.setCalm(e.target.checked);
              }}
            />
            Calm
          </label>
        </div>
      )}
    </div>
  );
}

// =============================================================================================
// For reduced motion, Save-Data, or no WebGL2: the same story as an editorial sequence.
// The three generated photographs open, carry the pregnancy and close it; the science chapters use
// still frames of the 3D (scripts/capture-posters.mjs).
const POSTERS: Record<number, { src: string; alt: string; pos?: string }> = {
  1: { src: plateBest(plates.mother.asset)!.url, alt: HERO_ALT, pos: pos(plates.mother.focus) },
  2: { src: "/story/posters/ch02.webp", alt: "Illustration of the female reproductive system: uterus, fallopian tubes and ovaries" },
  3: { src: "/story/posters/ch03.webp", alt: "Illustration of an ovary during stimulation, seen on ultrasound: several follicles show as dark circles" },
  4: { src: "/story/posters/ch04.webp", alt: "Illustration of egg collection: a fine needle guided by ultrasound drains a follicle" },
  5: { src: "/story/posters/ch05.webp", alt: "Illustration of an egg surrounded by corona cells as sperm approach" },
  6: { src: "/story/posters/ch06.webp", alt: "Illustration of a blastocyst-stage embryo within its zona pellucida" },
  7: { src: "/story/posters/ch07.webp", alt: "Illustration of an embryo transfer catheter passing through the cervix into the uterus" },
  8: { src: "/story/posters/ch08.webp", alt: "Illustration of a blastocyst that has hatched from its zona, attaching to the lining of the uterus" },
  9: { src: "/story/posters/ch09.webp", alt: "Illustration of an early pregnancy at about 7 weeks: gestational sac, yolk sac and embryo" },
  10: { src: plateBest(plates.hands.asset)!.url, alt: "A pregnant woman's hands gently cradling her belly", pos: pos(plates.hands.focus) },
  11: { src: plateBest(plates.newborn.asset)!.url, alt: "A mother smiling down at her sleeping newborn, held securely in her arms", pos: pos(plates.newborn.focus) },
};

function StaticStory() {
  const byChapter = (n: number) => panels.filter((p) => p.chapter === n);
  return (
    <section id="life-unfolds" aria-labelledby="life-h1" className="bg-paper">
      {chapters.map((c) => {
        const ps = byChapter(c.n);
        const dark = c.n >= 2 && c.n <= 9;
        const poster = POSTERS[c.n];
        const photo = c.n === 1 || c.n >= 10;
        return (
          <div key={c.id} className={`relative ${dark ? "on-night night-glow" : ""} ${c.n === 1 ? "min-h-[100svh]" : ""}`}>
            <div className={`grid items-center gap-10 ${c.n === 1 ? "min-h-[100svh]" : "section-tight"} wrap lg:grid-cols-12`}>
              <div className={`${c.n === 1 ? "relative z-10 pt-32 lg:col-span-6" : "lg:col-span-5"}`}>
                {ps.map((p) => (
                  <div key={p.id} className="mb-8">
                    {p.label && <p className="t-label">{p.cta === "hero" ? p.label : `${String(p.chapter).padStart(2, "0")} · ${p.label}`}</p>}
                    {p.heading &&
                      (p.level === 1 ? (
                        <h1 id="life-h1" className="t-hero mt-5">{rich(p.heading)}</h1>
                      ) : (
                        <h2 className={`${p.level === 2 || p.cta === "final" ? "t-h2" : "t-h3"} mt-4`}>{rich(p.heading)}</h2>
                      ))}
                    {p.body.map((b, i) => (
                      <p key={i} className="t-lede mt-5">{b}</p>
                    ))}
                    {p.cta && (
                      <div className="mt-8 flex flex-wrap gap-3">
                        <Link href="/contact#appointment" className={`btn ${dark ? "btn-light" : "btn-solid"}`}>
                          {p.cta === "hero" ? "Book a consultation" : "Begin your journey"}
                        </Link>
                        {p.cta === "final" && (
                          <a href={whatsappLink()} target="_blank" rel="noopener noreferrer" className="btn">
                            Talk to our fertility specialist
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <figure className={`plate ${c.n === 1 ? "absolute inset-0 -z-0" : "lg:col-span-7"}`}>
                <div className={`relative overflow-hidden ${c.n === 1 ? "h-full" : "ap-soft aspect-[16/10]"}`}>
                  <Image src={poster.src} alt={poster.alt} fill sizes={c.n === 1 ? "100vw" : "(max-width: 1024px) 100vw, 58vw"} className="object-cover" style={{ objectPosition: poster.pos ?? "60% 50%" }} priority={c.n === 1} />
                  {c.n === 1 && <div className="absolute inset-0 bg-gradient-to-r from-paper/90 via-paper/55 to-transparent" />}
                  {c.n === 1 && <p className="absolute bottom-4 right-5 text-[11px] text-ink-soft">AI-generated image, not a patient</p>}
                </div>
                {c.n > 1 && (
                  <figcaption>
                    <span className="pl">Fig. {c.n}</span>
                    <span>{c.title}. {photo ? "AI-generated image, not a patient." : "Illustrative visualisation, not to scale; not an individual outcome."}</span>
                  </figcaption>
                )}
              </figure>
            </div>
          </div>
        );
      })}
    </section>
  );
}
