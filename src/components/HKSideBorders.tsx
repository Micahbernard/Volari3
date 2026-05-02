"use client";

// ─────────────────────────────────────────────────────────────
// HK SIDE BORDERS — Tall ornamental left/right borders
//
// Four corner ornaments (64px each) with thin vertical guides
// connecting top to bottom on each side. The ornaments feature
// elegant inward-curling scrolls — the signature HK motif.
//
//    ┌─╮              ╭─┐
//    │                │
//    │    VOLARI     │
//    │                │
//    └─╯              ╰─┘
//
// ─────────────────────────────────────────────────────────────

const STROKE = "rgba(200, 215, 235, 0.85)";
const STROKE_W = 1.6;

// Each corner is a 64x64 SVG with graceful inward-curling flourishes
const TL = `
  M 2 2 L 2 48
  M 2 2 C 2 16 10 26 22 32 C 30 36 40 38 48 38
  M 2 8 C 2 18 8 26 18 30 C 24 34 32 36 40 36
  M 46 36 C 50 34 52 38 50 42 C 48 46 44 46 42 42 C 40 38 42 34 46 36
`;

const TR = `
  M 62 2 L 62 48
  M 62 2 C 62 16 54 26 42 32 C 34 36 24 38 16 38
  M 62 8 C 62 18 56 26 46 30 C 40 34 32 36 24 36
  M 18 36 C 14 34 12 38 14 42 C 16 46 20 46 22 42 C 24 38 22 34 18 36
`;

const BL = `
  M 2 62 L 2 16
  M 2 62 C 2 48 10 38 22 32 C 30 28 40 26 48 26
  M 2 56 C 2 46 8 38 18 34 C 24 30 32 28 40 28
  M 46 28 C 50 30 52 26 50 22 C 48 18 44 18 42 22 C 40 26 42 30 46 28
`;

const BR = `
  M 62 62 L 62 16
  M 62 62 C 62 48 54 38 42 32 C 34 28 24 26 16 26
  M 62 56 C 62 46 56 38 46 34 C 40 30 32 28 24 28
  M 18 28 C 14 30 12 26 14 22 C 16 18 20 18 22 22 C 24 26 22 30 18 28
`;

const PATHS = { tl: TL, tr: TR, bl: BL, br: BR };

function HKCorner({ position }: { position: "tl" | "tr" | "bl" | "br" }) {
  const path = PATHS[position];
  const classes = {
    tl: "top-0 left-0",
    tr: "top-0 right-0",
    bl: "bottom-0 left-0",
    br: "bottom-0 right-0",
  };

  return (
    <div className={`absolute ${classes[position]}`}>
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d={path} stroke={STROKE} strokeWidth={STROKE_W} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function VGuide({ side }: { side: "left" | "right" }) {
  return (
    <div
      className={`absolute top-[48px] bottom-[48px] w-px ${side === "left" ? "left-[31px]" : "right-[31px]"}`}
      style={{ background: "linear-gradient(to bottom, transparent, rgba(195,210,230,0.5) 20%, rgba(195,210,230,0.5) 80%, transparent)" }}
    />
  );
}

export default function HKSideBorders() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      <HKCorner position="tl" />
      <HKCorner position="tr" />
      <HKCorner position="bl" />
      <HKCorner position="br" />
      <VGuide side="left" />
      <VGuide side="right" />
    </div>
  );
}
