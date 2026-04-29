"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLenis } from "@/providers/SmoothScrollProvider";
import { useTheme } from "@/providers/ThemeProvider";
import NavMenuOverlay from "@/components/NavMenuOverlay";
import MercuryMenuToggle from "@/components/MercuryMenuToggle";

gsap.registerPlugin(ScrollTrigger);

// ─────────────────────────────────────────────────────────────
// Navbar — Logo + orbit menu trigger (dot + ring).
// Click: full-screen NavMenuOverlay (z-55). Lenis paused while open.
// ─────────────────────────────────────────────────────────────

export default function Navbar() {
  const lenis = useLenis();
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  const navRef = useRef<HTMLElement>(null);
  // Wraps crest button + wordmark link. Entrance mask wipe reveals the
  // whole cluster together, same as the old single-Link implementation.
  const logoRef = useRef<HTMLDivElement>(null);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);
  const ruleRef = useRef<HTMLDivElement>(null);
  const menuOpenRef = useRef(menuOpen);

  useEffect(() => {
    menuOpenRef.current = menuOpen;
  }, [menuOpen]);

  useEffect(() => {
    if (!lenis) return;
    if (menuOpen) lenis.stop();
    else lenis.start();
  }, [lenis, menuOpen]);

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
          {/* Crest + wordmark — split into sibling button + link so the
              crest can be its own interactive target (theme flip) without
              nesting a button inside an anchor (invalid HTML). The wrapping
              div holds the logoRef the entrance wipe targets. */}
          <div
            ref={logoRef}
            className="relative inline-flex min-w-0 shrink-0 items-center gap-3 opacity-0 sm:gap-3.5"
          >
            {/* Engraved monogram crest — doubles as the theme toggle.
                Label swaps Daybreak/Nightfall based on current theme so
                the cursor tooltip telegraphs what the click will do. */}
            <button
              type="button"
              onClick={(e) => toggleTheme(e.currentTarget)}
              data-cursor-magnetic
              data-cursor-label={theme === "void" ? "Daybreak" : "Nightfall"}
              aria-label={
                theme === "void"
                  ? "Switch to daybreak theme"
                  : "Switch to void theme"
              }
              className="group/crest relative block h-9 w-9 shrink-0 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-v-accent/50 sm:h-10 sm:w-10"
            >
              {/* Hex frame — hairline, brightens to gold on hover */}
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
                {/* Inner decorative hex — thinner, emerges on hover */}
                <polygon
                  points="20,7 31,13.5 31,26.5 20,33 9,26.5 9,13.5"
                  stroke="currentColor"
                  strokeWidth="0.5"
                  className="text-v-smoke/0 transition-[color] duration-500 group-hover/crest:text-v-accent/40"
                />
              </svg>
              {/* Serif V — silver base; gold overlay ink-fills upward on hover via clip-path */}
              <span
                aria-hidden
                className="absolute inset-0 flex items-center justify-center pb-[1px] font-[family-name:var(--font-playfair)] text-[1.35rem] leading-none tracking-[-0.02em] text-v-silver/85 sm:text-[1.5rem]"
              >
                V
              </span>
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

            {/* Wordmark — Home link. Own hover group (/logo) so the crest
                button's hover doesn't accidentally trigger wordmark hovers.
                Hierarchy: L1 Volari (serif chalk), L2 Studio row (mono eyebrow). */}
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
                {/* N°01 ↔ N°02 — both labels occupy the same slot via absolute
                    positioning on the secondary. Visibility toggled by opacity
                    so the body.theme-flipping global transition gives the
                    label a smooth 1.4s crossfade synced with the rest of the
                    theme flip. Outside the flip window the swap is instant,
                    which is fine — nothing else is changing then.
                    N°02 uses warm gold since day is the "substance" phase. */}
                <span className="relative inline-block font-[family-name:var(--font-geist-mono)] text-[8px] uppercase leading-none tracking-[0.35em] sm:text-[9px]">
                  <span
                    aria-hidden={theme !== "void"}
                    className={`block text-v-silver/55 transition-[color] duration-500 group-hover/logo:text-v-silver/90 ${
                      theme === "void" ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    N°01
                  </span>
                  <span
                    aria-hidden={theme !== "day"}
                    className={`absolute top-0 left-0 block text-v-accent/75 transition-[color] duration-500 group-hover/logo:text-v-accent ${
                      theme === "day" ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    N°02
                  </span>
                </span>
              </span>
            </Link>
          </div>

          {/* Mercury menu toggle — silver/chrome liquid-fill chip.
              Replaces the gold decanter. Cool palette only (no warm
              tones), hairline border, mercury bath rises from below
              on hover with breathing meniscus + sub-pixel grain.
              Hamburger ↔ ✕ morph keyed off menuOpen. The trigger only
              opens; close happens from inside <NavMenuOverlay /> while
              the navbar is hidden behind it. */}
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
