"use client";

// ─────────────────────────────────────────────────────────────
// HK CORNER HINGES — Machined ornamental corner joints
//
// Four corner brackets where horizontal and vertical gradient
// rules meet. Each joint is a small machined flourish — thin
// L-shaped lines with a decorative terminal at the corner.
//
//    ◇────              ────◇
//    │                    │
//    │     VOLARI         │
//    │                    │
//    ◇────              ────◇
//
// Design: thin steel lines (1.2px) with a small symmetrical
// bracket flourish at each corner intersection. No full frame.
// The vertical rules mirror the horizontal gradient rules.
// ─────────────────────────────────────────────────────────────

const STROKE = "rgba(195, 210, 230, 0.70)";
const STROKE_W = 1.2;

function CornerHinge({ position }: { position: "tl" | "tr" | "bl" | "br" }) {
  // Each hinge: horizontal + vertical line with small bracket flourish
  const isLeft = position === "tl" || position === "bl";
  const isTop = position === "tl" || position === "tr";

  // The flourish path: a small bracket with symmetrical curved arms
  // and a center dot — like a machined hinge joint
  const flourishPath = isLeft && isTop
    ? `M 2 28 L 2 14 Q 2 2 14 2 L 28 2` // top-left: down then right
    : !isLeft && isTop
    ? `M 46 28 L 46 14 Q 46 2 34 2 L 20 2` // top-right: down then left
    : isLeft && !isTop
    ? `M 2 20 L 2 34 Q 2 46 14 46 L 28 46` // bottom-left: up then right
    : `M 46 20 L 46 34 Q 46 46 34 46 L 20 46`; // bottom-right: up then left

  // Decorative inner accent line — parallel, slightly inset
  const accentPath = isLeft && isTop
    ? `M 8 28 L 8 18 Q 8 8 18 8 L 28 8`
    : !isLeft && isTop
    ? `M 40 28 L 40 18 Q 40 8 30 8 L 20 8`
    : isLeft && !isTop
    ? `M 8 20 L 8 30 Q 8 40 18 40 L 28 40`
    : `M 40 20 L 40 30 Q 40 40 30 40 L 20 40`;

  // Tiny center dot at the corner joint
  const dotCx = isLeft ? 8 : 40;
  const dotCy = isTop ? 8 : 40;

  const posClass = {
    tl: "-top-px -left-px",
    tr: "-top-px -right-px",
    bl: "-bottom-px -left-px",
    br: "-bottom-px -right-px",
  };

  return (
    <div className={`absolute ${posClass[position]}`}>
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d={flourishPath} stroke={STROKE} strokeWidth={STROKE_W} strokeLinecap="round" strokeLinejoin="round" />
        <path d={accentPath} stroke="rgba(160, 180, 205, 0.30)" strokeWidth={1} strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={dotCx} cy={dotCy} r="1.5" fill={STROKE} />
      </svg>
    </div>
  );
}

export default function HKCornerHinges() {
  return (
    <div className="pointer-events-none absolute inset-0 flex justify-center" aria-hidden="true">
      <div className="relative h-full w-full max-w-6xl">
        {/* Left vertical rule — mirrors the horizontal gradient rules */}
        <div
          className="absolute left-0 top-0 bottom-0 w-px"
          style={{
            background: "linear-gradient(to bottom, transparent 0%, rgba(195,210,230,0.35) 8%, rgba(195,210,230,0.35) 92%, transparent 100%)",
          }}
        />

        {/* Right vertical rule */}
        <div
          className="absolute right-0 top-0 bottom-0 w-px"
          style={{
            background: "linear-gradient(to bottom, transparent 0%, rgba(195,210,230,0.35) 8%, rgba(195,210,230,0.35) 92%, transparent 100%)",
          }}
        />

        {/* Four corner hinges */}
        <CornerHinge position="tl" />
        <CornerHinge position="tr" />
        <CornerHinge position="bl" />
        <CornerHinge position="br" />
      </div>
    </div>
  );
}
