"use client";

// ─────────────────────────────────────────────────────────────
// HK FRAME BORDER — Elegant calligraphic frame
//
// A single continuous ornamental border with graceful
// corner flourishes. Inspired by the clean ink-line
// aesthetic of Hollow Knight's UI frames.
//
// Design principles:
//   - One main stroke, continuous around the frame
//   - At each corner: a flowing inward curl (2-3 elegant curves)
//   - No extra decoration — let the lines breathe
//   - Stroke is visible but refined (0.7 opacity, 1.5px)
// ─────────────────────────────────────────────────────────────

const STROKE = "rgba(185, 200, 220, 0.70)";
const STROKE_W = 1.5;

// Single unified path: edges + flowing corner curls
const FRAME_PATH = `
  M 90 20 L 310 20
  M 90 380 L 310 380
  M 20 90 L 20 310
  M 380 90 L 380 310
  M 90 20 C 60 20 40 35 30 55 C 22 72 18 85 20 90
  M 310 20 C 340 20 360 35 370 55 C 378 72 382 85 380 90
  M 90 380 C 60 380 40 365 30 345 C 22 328 18 315 20 310
  M 310 380 C 340 380 360 365 370 345 C 378 328 382 315 380 310
  M 20 90 C 20 60 35 40 55 30 C 72 22 85 18 90 20
  M 380 90 C 380 60 365 40 345 30 C 328 22 315 18 310 20
  M 20 310 C 20 340 35 360 55 370 C 72 378 85 382 90 380
  M 380 310 C 380 340 365 360 345 370 C 328 378 315 382 310 380
`;

// Inner accent — a subtler echo of the main frame
const ACCENT_PATH = `
  M 82 28 L 308 28
  M 82 372 L 308 372
  M 28 82 L 28 308
  M 372 82 L 372 308
  M 82 28 C 58 28 42 40 34 56 C 28 70 24 80 26 86
  M 308 28 C 332 28 348 40 356 56 C 362 70 366 80 364 86
  M 82 372 C 58 372 42 360 34 344 C 28 330 24 320 26 314
  M 308 372 C 332 372 348 360 356 344 C 362 330 366 320 364 314
`;

export default function HKFrameBorder({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      viewBox="0 0 400 400"
      preserveAspectRatio="none"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d={FRAME_PATH}
        stroke={STROKE}
        strokeWidth={STROKE_W}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d={ACCENT_PATH}
        stroke="rgba(140, 160, 185, 0.30)"
        strokeWidth={1}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
