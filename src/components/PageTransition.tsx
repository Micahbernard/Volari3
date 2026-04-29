"use client";

import { useEffect, useRef, useState } from "react";
import { animate, usePresence } from "framer-motion";
import InkBleedOverlay from "@/components/InkBleedOverlay";

// Volari: no spring physics — long, cinematic eases; ink-bleed reveal, not generic clip masks.

const EASE_ENTER: [number, number, number, number] = [0.16, 1, 0.28, 1];
const EASE_EXIT: [number, number, number, number] = [0.65, 0.02, 0.23, 1];

/** Slower for impact; shortened when user prefers reduced motion (handled in overlay + here). */
const DURATION_ENTER_S = 2.45;
const DURATION_EXIT_S = 2.05;

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  return reduced;
}

export default function PageTransition({
  children,
}: {
  children: React.ReactNode;
}) {
  const progressRef = useRef(1);
  const [isPresent, safeToRemove] = usePresence();
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const enterDur = prefersReducedMotion ? 0.45 : DURATION_ENTER_S;
    const exitDur = prefersReducedMotion ? 0.4 : DURATION_EXIT_S;

    if (isPresent) {
      progressRef.current = 1;
      const controls = animate(1, 0, {
        duration: enterDur,
        ease: EASE_ENTER,
        onUpdate: (v) => {
          progressRef.current = v;
        },
      });
      return () => controls.stop();
    }

    const controls = animate(progressRef.current, 1, {
      duration: exitDur,
      ease: EASE_EXIT,
      onUpdate: (v) => {
        progressRef.current = v;
      },
      onComplete: () => {
        safeToRemove();
      },
    });
    return () => controls.stop();
  }, [isPresent, safeToRemove, prefersReducedMotion]);

  return (
    <div className="relative min-h-0">
      <div className="relative z-0">{children}</div>
      <InkBleedOverlay progressRef={progressRef} />
    </div>
  );
}
