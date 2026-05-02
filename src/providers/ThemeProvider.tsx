"use client";

import React, { createContext, useContext, type ReactNode } from "react";

// ─────────────────────────────────────────────────────────────
// Theme Provider — Void only. No day mode.
//
// The site is permanently in the Abyss. The ThemeProvider is
// kept as a stub so components that import useTheme don't break,
// but it always returns "void" and no-op for toggle.
// ─────────────────────────────────────────────────────────────

export type Theme = "void";

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  isFlipping: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "void",
  toggleTheme: () => {},
  isFlipping: false,
});

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}

export default function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeContext.Provider value={{ theme: "void", toggleTheme: () => {}, isFlipping: false }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Stubs for backward compatibility — no-op since void only
export function registerShaderFlip(): () => void {
  return () => {};
}

export function registerShadowConsume(): () => void {
  return () => {};
}

export const FLIP_DURATION_MS = 0;
