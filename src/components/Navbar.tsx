"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useCallback } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLenis } from "@/providers/SmoothScrollProvider";
import NavMenuOverlay from "@/components/NavMenuOverlay";
import MercuryMenuToggle from "@/components/MercuryMenuToggle";

gsap.registerPlugin(ScrollTrigger);

// ─────────────────────────────────────────────────────────────
// Navbar — Logo + orbit menu trigger (dot + ring).
// Click the V crest: void pulse shockwave effect.
// ─────────────────────────────────────────────────────────────

export default function Navbar() {
  const lenis = useLenis();
  const [menuOpen, setMenuOpen] = useState(false);

  const navRef = useRef<HTMLElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);
  const ruleRef = useRef<HTMLDivElement>(null);
  const menuOpenRef = useRef(menuOpen);
  const crestRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    menuOpenRef.current = menuOpen;
  }, [menuOpen]);

  useEffect(() => {
    if (!lenis) return;
    if (menuOpen) lenis.stop();
    else lenis.start();
  }, [lenis, menuOpen]);

  // Void pulse — click the crest to trigger a shockwave
  const triggerVoidPulse = useCallback(() => {
    const crest = crestRef.current;
    if (!crest) return;

    // Add the pulse class, remove after animation
    crest.classList.add("void-pulse-active");
    setTimeout(() => {
      crest.classList.remove("void-pulse-active");
    }, 900);
  }, []);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    const ctx = gsap.context(() => {
      const entranceTl = gsap.timeline({
        defaults: { ease: "power4.out" },
        delay: 2.0,
      });

      if (logoRef.current) {
        entranceTl.fromTo(
          logoRef.current,
          { clipPath: "inset(0 100% 0 0)", opacity: 0 },
          { clipPath: "inset(0 0% 0 0)", opacity: 1, duration: 1 },
          0
        );
      }

      if (menuTriggerRef.current) {
        entranceTl.fromTo(
          menuTriggerRef.current,
          { y: -18, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.85, ease: "power3.out" },
          0.2
        );
      }

      if (ruleRef.current) {
        entranceTl.fromTo(
          ruleRef.current,
          { scaleX: 0, transformOrigin: "left center" },
          { scaleX: 1, duration: 1.2, ease: "expo.out" },
          0.1
        );
      }

      let lastDirection = -1;

      ScrollTrigger.create({
        start: "top -80",
        end: "max",
        onUpdate: (self) => {
          const direction = self.direction;
          if (menuOpenRef.current) return;

          if (direction !== lastDirection) {
            lastDirection = direction;

            if (direction === 1) {
              gsap.to(nav, {
                y: "-100%",
                duration: 0.5,
                ease: "power3.inOut",
              });
            } else {
              gsap.to(nav, {
                y: "0%",
                duration: 0.4,
                ease: "power3.out",
              });
            }
          }
        },
      });

      ScrollTrigger.create({
        start: "top -100",
        onEnter: () => nav.classList.add("nav-scrolled"),
        onLeaveBack: () => nav.classList.remove("nav-scrolled"),
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <>
      <nav
        ref={navRef}
        className="nav-viewport-inset fixed top-0 right-0 left-0 z-50 box-border transition-[backdrop-filter,background-color] duration-500"
        style={{ willChange: "transform" }}
      >
        <div className="mx-auto flex h-[var(--header-height)] w-full max-w-[90rem] items-center justify-between">
          <div
            ref={logoRef}
            className="relative inline-flex min-w-0 shrink-0 items-center gap-3 opacity-0 sm:gap-3.5"
          >
            {/* V crest — void pulse on click */}
            <button
              ref={crestRef}
              type="button"
              onClick={triggerVoidPulse}
              data-cursor-magnetic
              data-cursor-label="Pulse"
              aria-label="Trigger void pulse"
              className="group/crest relative block h-9 w-9 shrink-0 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-v-accent/50 sm:h-10 sm:w-10"
            >
              {/* Hex frame */}
              <svg
                viewBox="0 0 40 40"
                className="absolute inset-0 h-full w-full overflow-visible"
                fill="none"
                aria-hidden
              >
                <polygon
                  points="20,2 36,11 36,29 20,38 4,29 4,11"
                  stroke="currentColor"
                  strokeWidth="1"
                  className="text-v-smoke/45 transition-[color,filter] duration-500 group-hover/crest:text-v-accent group-hover/crest:[filter:drop-shadow(0_0_6px_var(--accent-glow-strong))]"
                />
                <polygon
                  points="20,7 31,13.5 31,26.5 20,33 9,26.5 9,13.5"
                  stroke="currentColor"
                  strokeWidth="0.5"
                  className="text-v-smoke/0 transition-[color] duration-500 group-hover/crest:text-v-accent/40"
                />
              </svg>
              {/* Serif V — silver base */}
              <span
                aria-hidden
                className="v-emblem-glow absolute inset-0 flex items-center justify-center pb-[1px] font-[family-name:var(--font-playfair)] text-[1.35rem] leading-none tracking-[-0.02em] text-v-silver/85 transition-[color,text-shadow] duration-300 group-hover/crest:text-v-white sm:text-[1.5rem]"
              >
                V
              </span>
              {/* Gold overlay V */}
              <span
                aria-hidden
                className="absolute inset-0 flex items-center justify-center pb-[1px] font-[family-name:var(--font-playfair)] text-[1.35rem] leading-none tracking-[-0.02em] text-v-accent transition-[clip-path] duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] [clip-path:inset(100%_0_0_0)] group-hover/crest:[clip-path:inset(0%_0_0_0)] sm:text-[1.5rem]"
                style={{
                  textShadow: "0 0 8px var(--accent-glow-strong)",
                }}
              >
                V
              </span>
            </button>

            {/* Wordmark */}
            <Link
              href="/"
              data-cursor-magnetic
              data-cursor-label="Home"
              className="group/logo flex min-w-0 flex-col items-start gap-[0.4rem]"
            >
              <span className="-ml-[2px] block font-[family-name:var(--font-playfair)] text-[1.75rem] leading-[0.95] tracking-[-0.035em] text-v-chalk sm:text-[2rem] md:text-[2.125rem]">
                Volari
              </span>
              <span className="flex items-center gap-2.5">
                <span className="font-[family-name:var(--font-geist-mono)] text-[9px] uppercase leading-none tracking-[0.42em] text-v-silver/85 transition-[color] duration-500 group-hover/logo:text-v-chalk sm:text-[10px] sm:tracking-[0.48em]">
                  Studio
                </span>
                <span
                  aria-hidden
                  className="h-[3px] w-[3px] rounded-full bg-v-smoke/50 transition-[background-color] duration-500 group-hover/logo:bg-v-accent"
                />
                <span className="font-[family-name:var(--font-geist-mono)] text-[8px] uppercase leading-none tracking-[0.35em] text-v-silver/55 sm:text-[9px]">
                  N°01
                </span>
              </span>
            </Link>
          </div>

          <MercuryMenuToggle
            ref={menuTriggerRef}
            isOpen={menuOpen}
            onToggle={() => setMenuOpen(true)}
            aria-controls="site-menu"
            data-cursor-label="Menu"
            className="opacity-0"
          />
        </div>

        <div
          ref={ruleRef}
          className="h-px w-full bg-gradient-to-r from-transparent via-v-smoke/50 to-transparent"
          style={{ transform: "scaleX(0)" }}
        />
      </nav>

      {menuOpen ? (
        <NavMenuOverlay onClose={() => setMenuOpen(false)} />
      ) : null}
    </>
  );
}
