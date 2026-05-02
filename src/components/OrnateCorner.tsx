"use client";

// ─────────────────────────────────────────────────────────────
// ORNATE CORNER — Hollow Knight inspired filigree corner
//
// Elaborate gothic scrollwork with prominent spiral tips.
// Each corner features flowing curves, decorative flourishes,
// and the signature HK spiral-ended terminals.
// ─────────────────────────────────────────────────────────────

const STROKE_COLOR = "rgba(160, 175, 195, 0.45)";
const STROKE_WIDTH = 1.4;

/*
  Each corner is drawn on a 96x96 viewBox.
  The path flows from the outer corner inward, terminating in
  a decorative spiral scroll — the signature HK filigree motif.
  
  Path anatomy:
  1. Main arm extending from corner
  2. Decorative parallel arm (slightly offset)
  3. Inward curling return stroke
  4. Terminal spiral scroll (tight curl at the end)
*/

const TL_PATH = `
  M 90 4
  Q 65 4 50 8
  Q 38 12 32 22
  Q 26 32 28 42
  Q 30 50 36 54
  Q 42 58 48 56
  Q 54 54 56 48
  Q 58 42 54 38
  Q 50 34 44 36
  Q 40 38 40 42
  M 86 10
  Q 62 10 48 16
  Q 36 22 32 32
  Q 28 42 32 50
  Q 36 58 44 60
  Q 52 62 58 58
  Q 64 54 64 48
  Q 64 42 58 40
  M 4 90
  Q 4 65 8 50
  Q 12 38 22 32
  Q 32 26 42 28
  Q 50 30 54 36
  Q 58 42 56 48
  Q 54 54 48 56
  Q 42 58 38 54
  Q 34 50 36 44
  M 10 86
  Q 10 62 16 48
  Q 22 36 32 32
  Q 42 28 50 32
  Q 58 36 60 44
  Q 62 52 58 58
  Q 54 64 48 64
  Q 42 64 40 58
  Q 38 52 42 48
  Q 46 44 52 46
  Q 56 48 56 52
`;

const TR_PATH = `
  M 6 4
  Q 31 4 46 8
  Q 58 12 64 22
  Q 70 32 68 42
  Q 66 50 60 54
  Q 54 58 48 56
  Q 42 54 40 48
  Q 38 42 42 38
  Q 46 34 52 36
  Q 56 38 56 42
  M 10 10
  Q 34 10 48 16
  Q 60 22 64 32
  Q 68 42 64 50
  Q 60 58 52 60
  Q 44 62 38 58
  Q 32 54 32 48
  Q 32 42 38 40
  M 92 90
  Q 92 65 88 50
  Q 84 38 74 32
  Q 64 26 54 28
  Q 46 30 42 36
  Q 38 42 40 48
  Q 42 54 48 56
  Q 54 58 58 54
  Q 62 50 60 44
  M 86 86
  Q 86 62 80 48
  Q 74 36 64 32
  Q 54 28 46 32
  Q 38 36 36 44
  Q 34 52 38 58
  Q 42 64 48 64
  Q 54 64 56 58
  Q 58 52 54 48
  Q 50 44 44 46
  Q 40 48 40 52
`;

const BL_PATH = `
  M 4 6
  Q 4 31 8 46
  Q 12 58 22 64
  Q 32 70 42 68
  Q 50 66 54 60
  Q 58 54 56 48
  Q 54 42 48 40
  Q 42 38 38 42
  Q 34 46 36 52
  Q 38 56 42 56
  M 10 10
  Q 10 34 16 48
  Q 22 60 32 64
  Q 42 68 50 64
  Q 58 60 60 52
  Q 62 44 58 38
  Q 54 32 48 32
  Q 42 32 40 38
  M 90 92
  Q 65 92 50 88
  Q 38 84 32 74
  Q 26 64 28 54
  Q 30 46 36 42
  Q 42 38 48 40
  Q 54 42 56 48
  Q 58 54 54 58
  Q 50 62 44 60
  Q 40 58 40 54
  M 86 86
  Q 62 86 48 80
  Q 36 74 32 64
  Q 28 54 32 46
  Q 36 38 44 36
  Q 52 34 58 38
  Q 64 42 64 48
  Q 64 54 58 56
  Q 52 58 50 52
`;

const BR_PATH = `
  M 92 6
  Q 92 31 88 46
  Q 84 58 74 64
  Q 64 70 54 68
  Q 46 66 42 60
  Q 38 54 40 48
  Q 42 42 48 40
  Q 54 38 58 42
  Q 62 46 60 52
  Q 58 56 54 56
  M 86 10
  Q 86 34 80 48
  Q 74 60 64 64
  Q 54 68 46 64
  Q 38 60 36 52
  Q 34 44 38 38
  Q 42 32 48 32
  Q 54 32 56 38
  M 6 92
  Q 31 92 46 88
  Q 58 84 64 74
  Q 70 64 68 54
  Q 66 46 60 42
  Q 54 38 48 40
  Q 42 42 40 48
  Q 38 54 42 58
  Q 46 62 52 60
  Q 56 58 56 54
  M 10 86
  Q 34 86 48 80
  Q 60 74 64 64
  Q 68 54 64 46
  Q 60 38 52 36
  Q 44 34 38 38
  Q 32 42 32 48
  Q 32 54 38 56
  Q 44 58 46 52
`;

const CORNER_PATHS: Record<string, string> = {
  tl: TL_PATH,
  tr: TR_PATH,
  bl: BL_PATH,
  br: BR_PATH,
};

interface OrnateCornerProps {
  position: "tl" | "tr" | "bl" | "br";
  size?: number;
  className?: string;
}

export default function OrnateCorner({
  position,
  size = 80,
  className = "",
}: OrnateCornerProps) {
  const path = CORNER_PATHS[position];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 96 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d={path}
        stroke={STROKE_COLOR}
        strokeWidth={STROKE_WIDTH}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
