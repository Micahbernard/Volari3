"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

// ─────────────────────────────────────────────────────────────
// Full-viewport navigation overlay — “reveal the frame”
// Staggered links, horizontal rules, charcoal glass backdrop.
// ─────────────────────────────────────────────────────────────

const NAV_MENU_LINKS = [
  { n: "01", label: "About", href: "#about", cursorLabel: "Read" },
  { n: "02", label: "Services", href: "#services", cursorLabel: "Explore" },
  { n: "03", label: "Studio", href: "#studio", cursorLabel: "Method" },
  { n: "04", label: "Contact", href: "#contact", cursorLabel: "Connect" },
] as const;

type NavMenuOverlayProps = {
  onClose: () => void;
};

export default function NavMenuOverlay({ onClose }: NavMenuOverlayProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const ruleTopRef = useRef<HTMLDivElement>(null);
  const ruleBottomRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const linkRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const footerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const closeBtn = closeRef.current;
    closeBtn?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    const backdrop = backdropRef.current;
    const ruleT = ruleTopRef.current;
    const ruleB = ruleBottomRef.current;
    const links = linkRefs.current.filter(Boolean);
    const footer = footerRef.current;

    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    if (backdrop) {
      tl.fromTo(backdrop, { opacity: 0 }, { opacity: 1, duration: 0.45 }, 0);
    }
    if (ruleT) {
      tl.fromTo(
        ruleT,
        { scaleX: 0, transformOrigin: "center center" },
        { scaleX: 1, duration: 0.95, ease: "expo.out" },
        0.08
      );
    }
    if (links.length) {
      tl.fromTo(
        links,
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.55,
          stagger: 0.065,
          ease: "power3.out",
        },
        0.12
      );
    }
    if (footer) {
      tl.fromTo(
        footer,
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.5 },
        0.35
      );
    }
    if (ruleB) {
      tl.fromTo(
        ruleB,
        { scaleX: 0, transformOrigin: "center center" },
        { scaleX: 1, duration: 0.85, ease: "expo.out" },
        0.25
      );
    }

    return () => {
      tl.kill();
    };
  }, []);

  const setLinkRef = (i: number) => (el: HTMLAnchorElement | null) => {
    linkRefs.current[i] = el;
  };

  return (
    <div
      ref={rootRef}
      id="site-menu"
      role="dialog"
      aria-modal="true"
      aria-labelledby="site-menu-title"
      className="fixed inset-0 z-[55] flex flex-col"
      data-lenis-prevent
    >
      <div
        ref={backdropRef}
        className="absolute inset-0 bg-v-black/86 backdrop-blur-md opacity-0"
        aria-hidden
      />

      <div className="relative z-10 flex min-h-0 flex-1 flex-col px-6 pt-8 pb-10 sm:px-10 md:px-16">
        <div className="flex items-start justify-end">
          <button
            ref={closeRef}
            type="button"
            data-close
            onClick={onClose}
            className="group flex items-center gap-3 font-[family-name:var(--font-geist-mono)] text-[10px] uppercase tracking-[0.35em] text-v-silver transition-colors hover:text-v-chalk focus-visible:text-v-chalk focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-v-accent/60"
          >
            <span className="h-px w-8 bg-v-smoke transition-colors group-hover:bg-v-chalk" />
            Close
          </button>
        </div>

        <div className="mt-10 flex justify-center px-2">
          <div
            ref={ruleTopRef}
            className="h-px w-full max-w-2xl bg-gradient-to-r from-transparent via-v-smoke/55 to-transparent"
            style={{ transform: "scaleX(0)" }}
          />
        </div>

        <nav
          className="flex flex-1 flex-col justify-center py-12"
          aria-label="Primary"
        >
          <h2 id="site-menu-title" className="sr-only">
            Site navigation
          </h2>
          <ul className="mx-auto flex w-full max-w-2xl flex-col gap-2 sm:gap-3 md:gap-4">
            {NAV_MENU_LINKS.map((item, i) => (
              <li key={item.href}>
                <a
                  ref={setLinkRef(i)}
                  href={item.href}
                  onClick={onClose}
                  data-cursor-magnetic
                  data-cursor-label={item.cursorLabel}
                  className="group flex items-baseline gap-6 border-b border-v-smoke/15 py-4 opacity-0 transition-colors hover:border-v-accent/30 md:gap-10 md:py-5"
                >
                  <span className="font-[family-name:var(--font-geist-mono)] text-[10px] tabular-nums tracking-[0.25em] text-v-smoke/70">
                    {item.n}
                  </span>
                  <span className="font-[family-name:var(--font-playfair)] text-[clamp(1.75rem,6vw,3rem)] font-normal tracking-[-0.03em] text-v-chalk transition-colors group-hover:text-v-white">
                    {item.label}
                  </span>
                </a>
              </li>
            ))}
            <li>
              <a
                ref={setLinkRef(NAV_MENU_LINKS.length)}
                href="#contact"
                onClick={onClose}
                data-cursor-magnetic
                data-cursor-label="Let's talk"
                className="group flex items-baseline gap-6 border-b border-v-accent/25 py-4 opacity-0 transition-colors hover:border-v-accent md:gap-10 md:py-5"
              >
                <span className="font-[family-name:var(--font-geist-mono)] text-[10px] tabular-nums tracking-[0.25em] text-v-accent/80">
                  —
                </span>
                <span className="font-[family-name:var(--font-playfair)] text-[clamp(1.75rem,6vw,3rem)] font-normal italic tracking-[-0.03em] text-v-accent transition-colors group-hover:text-v-chalk">
                  Inquire
                </span>
              </a>
            </li>
          </ul>
        </nav>

        <div
          ref={footerRef}
          className="mt-auto flex flex-col items-center gap-4 border-t border-v-smoke/20 pt-8 opacity-0 sm:flex-row sm:justify-between"
        >
          <span className="font-[family-name:var(--font-geist-mono)] text-[9px] uppercase tracking-[0.45em] text-v-smoke">
            Est. 2024
          </span>
          <a
            href="mailto:hello@volari.studio"
            className="font-[family-name:var(--font-geist-mono)] text-[10px] tracking-[0.12em] text-v-silver transition-colors hover:text-v-chalk"
          >
            hello@volari.studio
          </a>
        </div>

        <div className="mt-8 flex justify-center">
          <div
            ref={ruleBottomRef}
            className="h-px w-full max-w-2xl bg-gradient-to-r from-transparent via-v-smoke/40 to-transparent"
            style={{ transform: "scaleX(0)" }}
          />
        </div>
      </div>
    </div>
  );
}
