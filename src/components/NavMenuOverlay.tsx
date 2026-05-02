"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

// ─────────────────────────────────────────────────────────────
// Full-viewport navigation overlay — "enter the void"
//
// Ghost-text item reveal: numbers emerge first, then labels
// clip in from blur + darkness. The world behind recedes into
// a heavy radial vignette — like HK's pause screen.
//
// Animation choreography:
//   0.0s  Backdrop radial vignette fades in
//   0.1s  Top rule draws
//   0.2s  Numbers (01-04) fade in, slight blur
//   0.35s Labels emerge from blur + clip-path, staggered
//   0.5s  Bottom rule draws
//   0.6s  Footer fades in
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
  const numRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const labelRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const inquireNumRef = useRef<HTMLSpanElement>(null);
  const inquireLabelRef = useRef<HTMLSpanElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const linkContainerRefs = useRef<(HTMLAnchorElement | null)[]>([]);

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
    const nums = numRefs.current.filter(Boolean);
    const labels = labelRefs.current.filter(Boolean);
    const inquireNum = inquireNumRef.current;
    const inquireLabel = inquireLabelRef.current;
    const footer = footerRef.current;
    const containers = linkContainerRefs.current.filter(Boolean);

    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    // Phase 1: Backdrop — radial vignette fades in
    // The world recedes into a pitch-black center with desaturated edges
    if (backdrop) {
      tl.fromTo(
        backdrop,
        { opacity: 0 },
        { opacity: 1, duration: 0.6, ease: "power2.out" },
        0
      );
    }

    // Phase 2: Top ornamental rule draws
    if (ruleT) {
      tl.fromTo(
        ruleT,
        { scaleX: 0, transformOrigin: "center center" },
        { scaleX: 1, duration: 1.0, ease: "expo.out" },
        0.1
      );
    }

    // Phase 3: Numbers emerge from blur + darkness
    // Each number fades in with a slight blur that clears
    if (nums.length) {
      tl.fromTo(
        nums,
        {
          opacity: 0,
          y: 10,
          filter: "blur(4px)",
        },
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 0.5,
          stagger: 0.08,
          ease: "power2.out",
        },
        0.2
      );
    }

    // Phase 4: Labels — ghost text reveal
    // Each label emerges from heavy blur and darkness via clip-path
    // Like whispers materializing from the void
    if (labels.length) {
      tl.fromTo(
        labels,
        {
          opacity: 0,
          y: 24,
          filter: "blur(10px)",
          clipPath: "inset(0 100% 0 0)",
        },
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          clipPath: "inset(0 0% 0 0)",
          duration: 0.75,
          stagger: 0.1,
          ease: "power3.out",
        },
        0.35
      );
    }

    // Phase 4b: Inquire row ghost reveal
    if (inquireNum && inquireLabel) {
      tl.fromTo(
        inquireNum,
        { opacity: 0, y: 10, filter: "blur(4px)" },
        { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.5, ease: "power2.out" },
        0.55
      );
      tl.fromTo(
        inquireLabel,
        { opacity: 0, y: 24, filter: "blur(10px)", clipPath: "inset(0 100% 0 0)" },
        { opacity: 1, y: 0, filter: "blur(0px)", clipPath: "inset(0 0% 0 0)", duration: 0.75, ease: "power3.out" },
        0.65
      );
    }

    // Phase 5: Link container borders fade in
    if (containers.length) {
      tl.fromTo(
        containers,
        { opacity: 0 },
        { opacity: 1, duration: 0.4, stagger: 0.06 },
        0.3
      );
    }

    // Phase 6: Footer
    if (footer) {
      tl.fromTo(
        footer,
        { opacity: 0, y: 12, filter: "blur(2px)" },
        { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.6 },
        0.7
      );
    }

    // Phase 7: Bottom rule
    if (ruleB) {
      tl.fromTo(
        ruleB,
        { scaleX: 0, transformOrigin: "center center" },
        { scaleX: 1, duration: 0.9, ease: "expo.out" },
        0.6
      );
    }

    return () => {
      tl.kill();
    };
  }, []);

  const setNumRef = (i: number) => (el: HTMLSpanElement | null) => {
    numRefs.current[i] = el;
  };
  const setLabelRef = (i: number) => (el: HTMLSpanElement | null) => {
    labelRefs.current[i] = el;
  };
  const setContainerRef = (i: number) => (el: HTMLAnchorElement | null) => {
    linkContainerRefs.current[i] = el;
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
      {/* Backdrop: heavy radial vignette — pitch black center, the world recedes */}
      <div
        ref={backdropRef}
        className="absolute inset-0 opacity-0"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(2,2,3,0.94) 0%, rgba(4,4,6,0.88) 35%, rgba(6,6,10,0.78) 60%, rgba(8,8,14,0.60) 100%)",
          backdropFilter: "blur(6px) saturate(0.5)",
          WebkitBackdropFilter: "blur(6px) saturate(0.5)",
        }}
        aria-hidden
      />

      <div className="relative z-10 flex min-h-0 flex-1 flex-col px-6 pt-8 pb-10 sm:px-10 md:px-16">
        <div className="flex items-start justify-end">
          <button
            ref={closeRef}
            type="button"
            data-close
            onClick={onClose}
            className="group pale-glow flex items-center gap-3 font-[family-name:var(--font-geist-mono)] text-[10px] uppercase tracking-[0.35em] text-v-silver transition-colors hover:text-v-chalk focus-visible:text-v-chalk focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-v-accent/60"
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
                  ref={setContainerRef(i)}
                  href={item.href}
                  onClick={onClose}
                  data-cursor-magnetic
                  data-cursor-label={item.cursorLabel}
                  className="group flex items-baseline gap-6 border-b border-v-smoke/15 py-4 opacity-0 transition-colors hover:border-v-accent/30 md:gap-10 md:py-5"
                >
                  {/* Number — ghost emerges first, brighter against void backdrop */}
                  <span
                    ref={setNumRef(i)}
                    className="font-[family-name:var(--font-geist-mono)] text-[10px] tabular-nums tracking-[0.25em] text-v-bone/50"
                  >
                    {item.n}
                  </span>
                  {/* Label — heavy blur clears, clip-path reveals */}
                  <span
                    ref={setLabelRef(i)}
                    className="pale-glow-strong font-[family-name:var(--font-playfair)] text-[clamp(1.75rem,6vw,3rem)] font-normal tracking-[-0.03em] text-v-chalk transition-colors group-hover:text-v-white"
                  >
                    {item.label}
                  </span>
                </a>
              </li>
            ))}
            <li>
              <a
                ref={setContainerRef(NAV_MENU_LINKS.length)}
                href="#contact"
                onClick={onClose}
                data-cursor-magnetic
                data-cursor-label="Let's talk"
                className="group flex items-baseline gap-6 border-b border-v-accent/25 py-4 opacity-0 transition-colors hover:border-v-accent md:gap-10 md:py-5"
              >
                <span
                  ref={inquireNumRef}
                  className="font-[family-name:var(--font-geist-mono)] text-[10px] tabular-nums tracking-[0.25em] text-v-bone/50"
                >
                  —
                </span>
                <span
                  ref={inquireLabelRef}
                  className="font-[family-name:var(--font-playfair)] text-[clamp(1.75rem,6vw,3rem)] font-normal italic tracking-[-0.03em] text-v-accent transition-colors pale-glow-strong group-hover:text-v-chalk"
                >
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
            className="pale-glow font-[family-name:var(--font-geist-mono)] text-[10px] tracking-[0.12em] text-v-silver transition-colors hover:text-v-chalk"
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
