"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { nav, site, whatsappLink } from "@/lib/site";
import { treatmentsByGroup } from "@/content/treatments";
import { roman } from "@/lib/format";
import { Logo, LogoSwap } from "./BrandMark";
import { ArrowRight, Close, Phone, WhatsApp } from "@/components/ui/Icons";

type Tone = "light" | "dark";

/**
 * Floating navigation. Over the Life Unfolds story it stays transparent and follows the story's
 * light/dark tone (html[data-immersive], html[data-tone]). Elsewhere it becomes a white capsule
 * once the page scrolls.
 */
export function Nav() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [immersive, setImmersive] = useState(false);
  const [tone, setTone] = useState<Tone>("light");
  const [open, setOpen] = useState<string | null>(null);
  const [drawer, setDrawer] = useState(false);
  const closeTimer = useRef<number | undefined>(undefined);
  const menuButton = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    const html = document.documentElement;
    const sync = () => {
      setImmersive(html.dataset.immersive === "true");
      setTone(html.dataset.tone === "dark" ? "dark" : "light");
    };
    sync();
    const mo = new MutationObserver(sync);
    mo.observe(html, { attributes: true, attributeFilter: ["data-immersive", "data-tone"] });
    return () => {
      window.removeEventListener("scroll", onScroll);
      mo.disconnect();
    };
  }, []);

  // Close menus on navigation.
  useEffect(() => {
    setOpen(null);
    setDrawer(false);
  }, [pathname]);

  // Drawer: lock scroll, focus management, Escape to close.
  useEffect(() => {
    const lenis = window.__lenis;
    if (drawer) {
      lenis?.stop();
      document.body.style.overflow = "hidden";
      const first = drawerRef.current?.querySelector<HTMLElement>("a, button");
      first?.focus();
    } else {
      lenis?.start();
      document.body.style.overflow = "";
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (drawer) {
        setDrawer(false);
        menuButton.current?.focus();
      }
      setOpen(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawer]);

  const trapFocus = useCallback((e: React.KeyboardEvent) => {
    if (e.key !== "Tab" || !drawerRef.current) return;
    const items = drawerRef.current.querySelectorAll<HTMLElement>("a, button");
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }, []);

  const enter = (label: string) => {
    window.clearTimeout(closeTimer.current);
    setOpen(label);
  };
  const leave = () => {
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setOpen(null), 160);
  };

  const floating = scrolled && !immersive;
  const onDark = !floating && (immersive ? tone === "dark" : false);
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href.split("#")[0].split("?")[0]));

  const groups = treatmentsByGroup();

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-[padding] duration-700 ${floating ? "pt-3" : "pt-0"}`}
      data-nav
    >
      <div
        className={`mx-auto flex items-center justify-between transition-all duration-700 ease-[var(--ease-soft)] ${
          floating
            ? "max-w-[1400px] w-[calc(100%-24px)] rounded-full border border-[var(--color-hair)] bg-paper px-4 py-1.5 shadow-[0_18px_50px_-30px_rgb(29_26_38/0.45)] md:px-6"
            : "max-w-[1480px] px-[var(--gutter)] py-5"
        } ${onDark ? "text-paper" : "text-ink"}`}
      >
        <Link href="/" className="relative z-10 shrink-0" aria-label="Momtree IVF & Genetics, home">
          <LogoSwap dark={onDark} className={`transition-[height] duration-700 ${floating ? "h-[58px]" : "h-[64px] md:h-[84px]"}`} />
        </Link>

        <nav aria-label="Main" className="hidden xl:block">
          <ul className="flex items-center gap-1">
            {nav.map((item) => {
              const hasMenu = Boolean(item.children || item.mega);
              const expanded = open === item.label;
              return (
                <li
                  key={item.label}
                  className="relative"
                  onMouseEnter={hasMenu ? () => enter(item.label) : undefined}
                  onMouseLeave={hasMenu ? leave : undefined}
                >
                  <div className="flex items-center">
                    <Link
                      href={item.href}
                      className={`relative px-3 py-2 text-[13px] font-medium tracking-[0.02em] transition-opacity hover:opacity-100 ${
                        isActive(item.href) ? "opacity-100" : "opacity-75"
                      }`}
                      aria-current={isActive(item.href) ? "page" : undefined}
                    >
                      {item.label}
                      {isActive(item.href) && (
                        <span className="absolute inset-x-3 -bottom-0.5 h-px bg-current opacity-60" aria-hidden="true" />
                      )}
                    </Link>
                    {hasMenu && (
                      <button
                        type="button"
                        className="-ml-2 grid h-8 w-6 place-items-center opacity-60 hover:opacity-100"
                        aria-label={`${item.label} menu`}
                        aria-expanded={expanded}
                        aria-controls={`menu-${item.label}`}
                        onClick={() => setOpen(expanded ? null : item.label)}
                      >
                        <svg viewBox="0 0 10 10" className={`h-2.5 w-2.5 transition-transform ${expanded ? "rotate-180" : ""}`} aria-hidden="true">
                          <path d="M1.5 3.5 5 7l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
                        </svg>
                      </button>
                    )}
                  </div>

                  {item.children && (
                    <div
                      id={`menu-${item.label}`}
                      className={`absolute left-1/2 top-full pt-4 transition-all duration-500 ${
                        expanded ? "visible translate-y-0 opacity-100" : "invisible -translate-y-2 opacity-0"
                      } -translate-x-1/2`}
                      onFocus={() => enter(item.label)}
                      onBlur={leave}
                    >
                      <ul className="w-[300px] rounded-[22px] border border-[var(--color-hair)] bg-paper p-3 text-ink shadow-[0_30px_80px_-40px_rgb(29_26_38/0.5)]">
                        {item.children.map((c) => (
                          <li key={c.href}>
                            <Link href={c.href} className="group block rounded-2xl px-4 py-3 transition-colors hover:bg-lilac">
                              <span className="block font-serif text-[1.2rem] leading-tight">{c.label}</span>
                              {c.note && <span className="mt-0.5 block text-[12.5px] text-ink-soft">{c.note}</span>}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {item.mega === "treatments" && (
                    <div
                      id={`menu-${item.label}`}
                      className={`fixed left-1/2 top-[84px] w-[min(1120px,calc(100vw-48px))] -translate-x-1/2 transition-all duration-500 ${
                        expanded ? "visible translate-y-0 opacity-100" : "invisible -translate-y-2 opacity-0"
                      }`}
                      onFocus={() => enter(item.label)}
                      onBlur={leave}
                    >
                      <div className="grid grid-cols-[1fr_1fr_1fr_280px] gap-x-8 gap-y-6 rounded-[28px] border border-[var(--color-hair)] bg-paper p-8 text-ink shadow-[0_40px_100px_-50px_rgb(29_26_38/0.55)]">
                        {groups.map((g) => (
                          <div key={g.id}>
                            <p className="t-label mb-3">{g.label}</p>
                            <ul className="space-y-1.5">
                              {g.items.map((t) => (
                                <li key={t.slug}>
                                  <Link href={`/treatments/${t.slug}`} className="group flex items-baseline gap-2.5 text-[15px] leading-snug">
                                    <span className="t-roman w-7 shrink-0 text-[13px]">{roman(t.n)}</span>
                                    <span className="link-line">{t.name}</span>
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                        <div className="row-span-2 col-start-4 row-start-1 flex flex-col justify-between rounded-[22px] bg-night p-6 text-paper">
                          <div>
                            <p className="t-label !text-leaf">Not sure where to begin?</p>
                            <p className="mt-3 font-serif text-[1.65rem] leading-[1.1] font-light">
                              Every journey starts with <em>understanding.</em>
                            </p>
                          </div>
                          <Link href="/treatments/fertility-evaluation" className="mt-6 inline-flex items-center gap-2 text-[13px] font-semibold tracking-[0.12em] uppercase text-leaf">
                            Fertility evaluation <ArrowRight className="h-4 w-4" />
                          </Link>
                        </div>
                        <div className="col-span-3 -mt-2 flex items-center justify-between border-t border-[var(--color-hair)] pt-4">
                          <span className="text-[13px] text-ink-soft">All 14 treatments, explained in plain language.</span>
                          <Link href="/treatments" className="text-[13px] font-semibold tracking-[0.12em] uppercase link-line">
                            View the full index
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/contact#appointment"
            className={`btn hidden sm:inline-flex !min-h-[44px] !px-5 !text-[11.5px] ${onDark ? "btn-light" : floating ? "btn-solid" : ""}`}
          >
            Book a consultation
          </Link>
          <button
            ref={menuButton}
            type="button"
            className={`relative grid h-11 w-11 place-items-center rounded-full border border-current/25 xl:hidden ${onDark ? "bg-night/40" : "bg-paper/90"}`}
            aria-label="Open menu"
            aria-expanded={drawer}
            aria-controls="mobile-drawer"
            onClick={() => setDrawer(true)}
          >
            <span className="flex w-[18px] flex-col gap-[5px]" aria-hidden="true">
              <span className="h-px w-full bg-current" />
              <span className="h-px w-2/3 bg-current" />
            </span>
          </button>
        </div>
      </div>

      {/* ---------------------------------------------------------------- mobile drawer */}
      <div
        id="mobile-drawer"
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
        onKeyDown={trapFocus}
        className={`fixed inset-0 z-[60] flex flex-col overflow-y-auto bg-night text-paper transition-[clip-path,visibility] duration-700 ease-[var(--ease-silk)] xl:hidden ${
          drawer ? "visible [clip-path:circle(150%_at_calc(100%-44px)_44px)]" : "invisible [clip-path:circle(0%_at_calc(100%-44px)_44px)]"
        }`}
      >
        <div className="flex items-center justify-between px-[var(--gutter)] py-5">
          <Link href="/" aria-label="Momtree IVF & Genetics, home">
            <Logo tone="white" className="h-[54px]" />
          </Link>
          <button
            type="button"
            className="grid h-11 w-11 place-items-center rounded-full border border-paper/30"
            onClick={() => {
              setDrawer(false);
              menuButton.current?.focus();
            }}
            aria-label="Close menu"
          >
            <Close />
          </button>
        </div>
        <nav aria-label="Mobile" className="flex-1 px-[var(--gutter)] pb-10 pt-4">
          <ul className="divide-y divide-paper/10 border-y border-paper/10">
            {nav.map((item, i) => (
              <li key={item.label}>
                {item.mega ? (
                  <details className="group">
                    <summary className="flex cursor-pointer list-none items-center justify-between py-4 font-serif text-[2rem] font-light leading-none">
                      <span>
                        <span className="mr-3 align-middle font-sans text-[11px] tracking-[0.2em] text-leaf">{String(i + 1).padStart(2, "0")}</span>
                        {item.label}
                      </span>
                      <span className="text-leaf transition-transform group-open:rotate-45" aria-hidden="true">
                        +
                      </span>
                    </summary>
                    <div className="grid gap-5 pb-6 pl-8 pt-1">
                      {groups.map((g) => (
                        <div key={g.id}>
                          <p className="t-label !text-leaf mb-2">{g.label}</p>
                          <ul className="space-y-1.5">
                            {g.items.map((t) => (
                              <li key={t.slug}>
                                <Link href={`/treatments/${t.slug}`} className="text-[15px] text-paper/85">
                                  {t.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                      <Link href="/treatments" className="text-[13px] font-semibold uppercase tracking-[0.14em] text-leaf">
                        All treatments →
                      </Link>
                    </div>
                  </details>
                ) : (
                  <Link href={item.href} className="flex items-center py-4 font-serif text-[2rem] font-light leading-none aria-[current=page]:text-leaf" aria-current={isActive(item.href) ? "page" : undefined}>
                    <span className="mr-3 font-sans text-[11px] tracking-[0.2em] text-leaf">{String(i + 1).padStart(2, "0")}</span>
                    {item.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
          <div className="mt-8 grid gap-3">
            <Link href="/contact#appointment" className="btn btn-leaf justify-center">
              Book a consultation
            </Link>
            <div className="grid grid-cols-2 gap-3">
              <a href={site.phone.href} className="btn btn-light justify-center !px-4">
                <Phone /> Call
              </a>
              <a href={whatsappLink()} target="_blank" rel="noopener noreferrer" className="btn btn-light justify-center !px-4">
                <WhatsApp className="h-4 w-4" /> WhatsApp
              </a>
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
}
