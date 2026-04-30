"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Register GSAP plugins once at module scope
gsap.registerPlugin(ScrollTrigger);

const LenisContext = createContext<Lenis | null>(null);

export function useLenis() {
  return useContext(LenisContext);
}

export default function SmoothScrollProvider({
  children,
}: {
  children: ReactNode;
}) {
  const lenisRef = useRef<Lenis | null>(null);
  const [lenis, setLenis] = useState<Lenis | null>(null);

  useEffect(() => {
    // Initialize Lenis
    const instance = new Lenis({
      lerp: 0.08,
      smoothWheel: true,
      wheelMultiplier: 1,
    });

    lenisRef.current = instance;
    queueMicrotask(() => setLenis(instance));

    // Bridge Lenis → GSAP ScrollTrigger
    // This is critical: every Lenis scroll event triggers a ScrollTrigger update
    // so GSAP-driven scroll animations stay perfectly in sync.
    instance.on("scroll", ScrollTrigger.update);

    // Use GSAP's ticker as the single animation loop.
    // This avoids a separate rAF loop — everything runs on one heartbeat.
    const tickerCallback = (time: number) => {
      instance.raf(time * 1000); // GSAP ticker time is in seconds, Lenis expects ms
    };

    gsap.ticker.add(tickerCallback);

    // Disable Lenis's internal rAF since GSAP's ticker drives it
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tickerCallback);
      instance.destroy();
      lenisRef.current = null;
      queueMicrotask(() => setLenis(null));
    };
  }, []);

  return (
    <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>
  );
}
