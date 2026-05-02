"use client";

import { useEffect, useRef } from "react";

// ─────────────────────────────────────────────────────────────
// ABYSS FOG — Layered atmospheric mist
//
// Hollow Knight's Abyss is defined by heavy fog that obscures
// vision and creates depth. This component renders multiple
// canvas-based fog layers that drift slowly across the screen,
// creating parallax depth without WebGL overhead.
//
// Three layers:
//   - Back:   slow, dense, dark fog (20% opacity)
//   - Middle: medium drift, lighter (12% opacity)
//   - Front:  fast, sparse wisps (6% opacity)
// ─────────────────────────────────────────────────────────────

interface FogLayer {
  speed: number;
  opacity: number;
  yOffset: number;
  scale: number;
  seed: number;
}

const LAYERS: FogLayer[] = [
  { speed: 0.08, opacity: 0.20, yOffset: 0.3, scale: 1.5, seed: 1 },
  { speed: 0.12, opacity: 0.12, yOffset: 0.5, scale: 1.0, seed: 2 },
  { speed: 0.18, opacity: 0.06, yOffset: 0.7, scale: 0.6, seed: 3 },
];

function drawFogLayer(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
  layer: FogLayer
) {
  const { speed, opacity, yOffset, scale, seed } = layer;

  ctx.save();
  ctx.globalAlpha = opacity;

  // Create multiple fog blobs using simplex-like noise
  const blobCount = 5;
  for (let i = 0; i < blobCount; i++) {
    const blobSeed = seed * 100 + i * 37;
    const baseX = ((blobSeed * 137.5) % width) * scale;
    const driftX = ((time * speed * 30) + blobSeed) % (width + 400) - 200;
    const x = (baseX + driftX) % (width + 400) - 200;
    const y = height * yOffset + Math.sin(time * 0.02 + blobSeed) * height * 0.1;
    const blobWidth = (200 + (blobSeed % 150)) * scale;
    const blobHeight = (80 + (blobSeed % 60)) * scale;

    const gradient = ctx.createRadialGradient(x, y, 0, x, y, blobWidth);
    gradient.addColorStop(0, "rgba(4, 4, 10, 0.8)");
    gradient.addColorStop(0.4, "rgba(6, 6, 14, 0.4)");
    gradient.addColorStop(1, "rgba(8, 8, 18, 0)");

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(x, y, blobWidth, blobHeight, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

export default function AbyssFog() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const timeRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio, 1.5);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener("resize", resize);

    const animate = () => {
      timeRef.current += 1;
      const time = timeRef.current;
      const w = window.innerWidth;
      const h = window.innerHeight;

      ctx.clearRect(0, 0, w, h);

      for (const layer of LAYERS) {
        drawFogLayer(ctx, w, h, time, layer);
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-[5]"
      style={{ mixBlendMode: "multiply" }}
      aria-hidden="true"
    />
  );
}
