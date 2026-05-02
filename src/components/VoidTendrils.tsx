"use client";

import { useEffect, useRef, useCallback } from "react";
import { gsap } from "gsap";

// ─────────────────────────────────────────────────────────────
// VOID TENDRILS — Floating shadow particles
//
// In Hollow Knight's Abyss, void particles drift upward like
// ash or shade fragments. This canvas component spawns small
// pale dots that rise, sway, and fade — creating the sense
// that the void itself is alive.
//
// Each particle:
//   - Spawns at random x, bottom of screen
//   - Rises with slight horizontal sway (sine wave)
//   - Fades in at birth, fades out before death
//   - Size: 1-3px, color: pale ghost white
//   - Speed: varies by particle (some fast, some slow)
// ─────────────────────────────────────────────────────────────

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
  swayPhase: number;
  swayAmp: number;
}

const MAX_PARTICLES = 60;
const SPAWN_RATE = 0.4; // particles per frame (on average)

function createParticle(w: number, h: number): Particle {
  const size = 1 + Math.random() * 2;
  const maxLife = 120 + Math.random() * 300; // 2-7 seconds at 60fps
  return {
    x: Math.random() * w,
    y: h + size,
    vx: (Math.random() - 0.5) * 0.3,
    vy: -(0.3 + Math.random() * 0.8), // upward drift
    size,
    alpha: 0,
    life: 0,
    maxLife,
    swayPhase: Math.random() * Math.PI * 2,
    swayAmp: 0.2 + Math.random() * 0.6,
  };
}

function updateParticle(p: Particle, w: number, h: number): boolean {
  p.life++;
  p.y += p.vy;
  p.x += p.vx + Math.sin(p.life * 0.015 + p.swayPhase) * p.swayAmp;

  // Fade in during first 10% of life
  const fadeInEnd = p.maxLife * 0.1;
  const fadeOutStart = p.maxLife * 0.75;

  if (p.life < fadeInEnd) {
    p.alpha = (p.life / fadeInEnd) * 0.5;
  } else if (p.life > fadeOutStart) {
    p.alpha = (1 - (p.life - fadeOutStart) / (p.maxLife - fadeOutStart)) * 0.5;
  } else {
    p.alpha = 0.5;
  }

  // Wrap x horizontally
  if (p.x < -10) p.x = w + 10;
  if (p.x > w + 10) p.x = -10;

  return p.life < p.maxLife && p.y > -10;
}

function drawParticle(ctx: CanvasRenderingContext2D, p: Particle) {
  if (p.alpha <= 0) return;

  ctx.save();
  ctx.globalAlpha = p.alpha;

  // Core dot
  ctx.fillStyle = "rgba(200, 215, 240, 0.9)";
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
  ctx.fill();

  // Soft glow around larger particles
  if (p.size > 1.5) {
    ctx.globalAlpha = p.alpha * 0.3;
    ctx.fillStyle = "rgba(180, 200, 230, 0.5)";
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

export default function VoidTendrils() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);
  const spawnAccRef = useRef<number>(0);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = window.innerWidth;
    const h = window.innerHeight;

    ctx.clearRect(0, 0, w, h);

    // Spawn new particles
    spawnAccRef.current += SPAWN_RATE;
    while (
      spawnAccRef.current >= 1 &&
      particlesRef.current.length < MAX_PARTICLES
    ) {
      spawnAccRef.current -= 1;
      particlesRef.current.push(createParticle(w, h));
    }

    // Update and draw
    particlesRef.current = particlesRef.current.filter((p) => {
      const alive = updateParticle(p, w, h);
      if (alive) drawParticle(ctx, p);
      return alive;
    });

    rafRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener("resize", resize);

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [animate]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-[6]"
      aria-hidden="true"
    />
  );
}
