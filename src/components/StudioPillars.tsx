"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const PILLARS = [
  {
    title: "Direction",
    body: "Positioning, narrative, and creative north star — so every decision aligns before a single frame ships.",
    href: "#about",
    cta: "Philosophy",
  },
  {
    title: "Craft",
    body: "Systems, motion, and typography in lockstep — bespoke surfaces that feel inevitable, not decorative.",
    href: "#services",
    cta: "Capabilities",
  },
  {
    title: "Delivery",
    body: "Performance-budgeted builds, disciplined handoff, and launch with confidence — shipped, measured, refined.",
    href: "#contact",
    cta: "Start a project",
  },
] as const;

function PillarVisual({ index }: { index: number }) {
  const noise =
    "absolute inset-0 opacity-[0.18] mix-blend-overlay bg-[url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2748%27 height=%2748%27%3E%3Cfilter id=%27n%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%270.9%27 numOctaves=%273%27/%3E%3C/filter%3E%3Crect width=%27100%25%27 height=%27100%25%27 filter=%27url(%23n)%27 opacity=%270.2%27/%3E%3C/svg%3E')]";

  if (index === 0) {
    return (
      <>
        <div className="absolute inset-0 bg-gradient-to-br from-v-accent/20 via-v-smoke/10 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_80%_at_30%_20%,var(--pillar-bokeh-gold),transparent_52%)]" />
        <div className={noise} />
      </>
    );
  }
  if (index === 1) {
    return (
      <>
        <div className="absolute inset-0 bg-gradient-to-tl from-v-smoke/25 via-transparent to-v-accent/10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_70%_60%,var(--pillar-bokeh-silver),transparent_55%)]" />
        <div className={noise} />
      </>
    );
  }
  return (
    <>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-v-smoke/15 to-v-black/85" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_100%,var(--pillar-bokeh-chalk),transparent_48%)]" />
      <div className={noise} />
    </>
  );
}

export default function StudioPillars() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      const rule = section.querySelector("[data-pillar-rule]");
      const intro = section.querySelector("[data-pillar-intro]");
      const cards = section.querySelectorAll("[data-pillar-card]");

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top 78%",
          end: "top 35%",
          toggleActions: "play none none none",
        },
      });

      if (rule) {
        tl.fromTo(
          rule,
          { scaleX: 0, transformOrigin: "left center" },
          { scaleX: 1, duration: 1.1, ease: "expo.out" },
          0
        );
      }

      if (intro) {
        tl.fromTo(
          intro,
          { y: 28, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.9, ease: "power3.out" },
          0.12
        );
      }

      if (cards.length) {
        tl.fromTo(
          cards,
          { y: 36, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.85,
            stagger: 0.12,
            ease: "power3.out",
          },
          0.25
        );
      }
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="studio"
      ref={sectionRef}
      className="relative border-t border-v-smoke/15 bg-v-black/20 px-8 py-24 md:px-16 md:py-32 lg:px-24"
    >
      <div className="mx-auto max-w-7xl">
        <div
          data-pillar-rule
          className="v-rule mb-14 md:mb-20"
          style={{ transform: "scaleX(0)" }}
        />

        <div data-pillar-intro className="mb-14 max-w-2xl opacity-0 md:mb-20">
          <p className="font-[family-name:var(--font-geist-mono)] text-[9px] uppercase tracking-[0.5em] text-v-accent">
            How we work
          </p>
          <h2 className="mt-4 font-[family-name:var(--font-playfair)] text-[clamp(1.75rem,4vw,2.75rem)] leading-[1.15] tracking-[-0.02em] text-v-chalk">
            Direction, craft, and delivery
          </h2>
          <p className="mt-4 font-[family-name:var(--font-geist-mono)] text-[11px] leading-[1.85] text-v-silver">
            Three beats — one continuous line from intent to launch. Each phase
            is discrete; together they are the Volari method.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-8 lg:gap-10">
          {PILLARS.map((pillar, index) => (
            <article
              key={pillar.title}
              data-pillar-card
              className="group flex flex-col opacity-0"
            >
              <div className="relative mb-6 aspect-[4/3] overflow-hidden rounded-sm border border-v-smoke/20 bg-v-black/30 transition-colors duration-500 group-hover:border-v-smoke/35">
                <PillarVisual index={index} />
                <div className="absolute bottom-3 left-3 font-[family-name:var(--font-geist-mono)] text-[8px] uppercase tracking-[0.35em] text-v-smoke/50">
                  {pillar.title}
                </div>
              </div>

              <h3 className="font-[family-name:var(--font-playfair)] text-xl tracking-[-0.02em] text-v-chalk md:text-[1.35rem]">
                {pillar.title}
              </h3>
              <p className="mt-3 flex-1 font-[family-name:var(--font-geist-mono)] text-[11px] leading-[1.85] text-v-silver">
                {pillar.body}
              </p>
              <a
                href={pillar.href}
                className="mt-6 inline-flex w-fit items-center gap-2 font-[family-name:var(--font-geist-mono)] text-[9px] uppercase tracking-[0.35em] text-v-accent/90 transition-colors hover:text-v-chalk"
                data-cursor-magnetic
                data-cursor-label="Open"
              >
                {pillar.cta}
                <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
                  →
                </span>
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
