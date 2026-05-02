"use client";

// ─────────────────────────────────────────────────────────────
// HK CORNER MARKS — Clean bracket bends
//
// Four discrete corner brackets. No spirals, no circles, no
// decoration beyond the bend itself. Just a thin steel line
// that turns a corner and curls slightly inward.
//
//    ╭─                  ─╮
//    │                    │
//    │     VOLARI         │
//    │                    │
//    ╰─                  ─╯
//
// ─────────────────────────────────────────────────────────────

const STROKE = "rgba(185, 200, 220, 0.65)";
const STROKE_W = 1.4;

function CornerBracket({ position }: { position: "tl" | "tr" | "bl" | "br" }) {
  const posClass = {
    tl: "top-3 left-3 md:top-5 md:left-5",
    tr: "top-3 right-3 md:top-5 md:right-5",
    bl: "bottom-3 left-3 md:bottom-5 md:left-5",
    br: "bottom-3 right-3 md:bottom-5 md:right-5",
  };

  // Clean bracket bends — just the lines, no terminals
  const paths: Record<string, string> = {
    tl: `
      M 2 28 L 2 14 Q 2 2 14 2 L 28 2
      M 6 28 L 6 18 Q 6 6 18 6 L 26 6
    `,
    tr: `
      M 34 28 L 34 14 Q 34 2 22 2 L 8 2
      M 30 28 L 30 18 Q 30 6 18 6 L 10 6
    `,
    bl: `
      M 2 8 L 2 22 Q 2 34 14 34 L 28 34
      M 6 8 L 6 18 Q 6 30 18 30 L 26 30
    `,
    br: `
      M 34 8 L 34 22 Q 34 34 22 34 L 8 34
      M 30 8 L 30 18 Q 30 30 18 30 L 10 30
    `,
  };

  return (
    <div className={`absolute ${posClass[position]}`}>
      <svg
        width="36"
        height="36"
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d={paths[position]}
          stroke={STROKE}
          strokeWidth={STROKE_W}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export default function HKCornerMarks() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      <CornerBracket position="tl" />
      <CornerBracket position="tr" />
      <CornerBracket position="bl" />
      <CornerBracket position="br" />
    </div>
  );
}
