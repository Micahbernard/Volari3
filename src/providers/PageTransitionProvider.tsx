"use client";

import { AnimatePresence } from "framer-motion";

// ─────────────────────────────────────────────────────────────
// Thin client boundary for AnimatePresence.
// Extracted so layout.tsx stays a Server Component (keeps
// metadata export, avoids "use client" on root layout).
// mode="wait" ensures exit animation completes before enter.
// ─────────────────────────────────────────────────────────────
export default function PageTransitionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AnimatePresence mode="wait">{children}</AnimatePresence>;
}
