"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { flushSync } from "react-dom";

// ─────────────────────────────────────────────────────────────
// Theme model
//
// Two themes: "void" (default, dark) and "day" (daybreak cream).
// Source of truth: `data-theme` attribute on <html>.
// Persistence: sessionStorage per tab — a fresh tab always starts
// in void so the flip remains a deliberate discovery act, not a
// sticky preference.
//
// Two directional transitions:
//   RISE (void → day) — View Transitions API radial sunrise from the
//     crest button. The browser snapshots <html> and clip-paths a
//     circle outward. Warm, bloomed, friendly.
//   SET  (day → void) — a WebGL "shadow consume" overlay rendered
//     by <ShadowConsumeOverlay /> (components/ShadowConsumeOverlay).
//     A domain-warped fBm ink body, polar tendrils, and a radial
//     front animate outward from the crest origin under GLSL; the
//     theme swap happens under a full-black peak so the mutation
//     is invisible. Bypasses View Transitions entirely because the
//     VT API aborts with InvalidStateError whenever
//     document.visibilityState is hidden (preview iframes,
//     background tabs), and the effect must be reliable.
// ─────────────────────────────────────────────────────────────

export type Theme = "void" | "day";

const STORAGE_KEY = "volari-theme";
/** Matches `body.theme-flipping` / View Transition animations in globals.css and shader warp envelope in WebGLBackground. */
export const FLIP_DURATION_MS = 1500;

/** Stamp crest centre (px) for radial sunlight / void clip-path + shader origin. Cleans up after flip. */
function setFlipOriginCss(originElement?: HTMLElement) {
  const root = document.documentElement;
  if (originElement) {
    const r = originElement.getBoundingClientRect();
    const ox = r.left + r.width / 2;
    const oy = r.top + r.height / 2;
    root.style.setProperty("--flip-ox", `${ox}px`);
    root.style.setProperty("--flip-oy", `${oy}px`);
  } else {
    root.style.setProperty("--flip-ox", `${window.innerWidth / 2}px`);
    root.style.setProperty("--flip-oy", `${Math.min(96, window.innerHeight * 0.12)}px`);
  }
}

function clearFlipOriginCss() {
  const root = document.documentElement;
  root.style.removeProperty("--flip-ox");
  root.style.removeProperty("--flip-oy");
}

// ─────────────────────────────────────────────────────────────
// Shadow-consume bridge — module-level
//
// <ShadowConsumeOverlay /> registers a trigger on mount that
// ThemeProvider invokes on day → void flips. The callback returns
// two promises:
//   – `peak`      resolves when the overlay has crossfaded to
//                 solid black; ThemeProvider swaps data-theme +
//                 shader palette inside that cover.
//   – `finished`  resolves after the full envelope (fade-in,
//                 expand, peak hold, fade-out); ThemeProvider
//                 releases the flip lock here.
//
// Kept as a direct function reference — same pattern as
// registerShaderFlip below — so there's exactly one failure
// point (registration) and no subscriber races.
// ─────────────────────────────────────────────────────────────
export type ShadowConsumeHandle = {
  peak: Promise<void>;
  finished: Promise<void>;
};

type ShadowConsumeCallback = (originX: number, originY: number) => ShadowConsumeHandle;
let shadowConsumeCallback: ShadowConsumeCallback | null = null;

/**
 * Called by ShadowConsumeOverlay on mount. Returns an unregister
 * fn so the effect can clean up on unmount.
 */
export function registerShadowConsume(cb: ShadowConsumeCallback): () => void {
  shadowConsumeCallback = cb;
  return () => {
    if (shadowConsumeCallback === cb) shadowConsumeCallback = null;
  };
}

// ─────────────────────────────────────────────────────────────
// Shader bridge — module-level
//
// WebGLBackground registers a flip callback on mount; ThemeProvider
// invokes it directly when toggleTheme fires. We intentionally do
// NOT use a window event or React context for this wire — a direct
// function reference has exactly one failure point (registration)
// and no subscriber races. The callback receives the target theme
// so the shader can lerp to the correct palette.
// ─────────────────────────────────────────────────────────────

// `instant: true` means "snap uFlip to the target value right now, don't lerp."
// Used by the View Transitions path so the browser's snapshot of the NEW
// DOM catches the shader at its final palette — otherwise the horizon-rise
// reveal would expose a half-lerped shader frozen in the pseudo-layer.
type ShaderFlipCallback = (target: Theme, instant?: boolean) => void;
let shaderFlipCallback: ShaderFlipCallback | null = null;

/**
 * Called by WebGLBackground on mount. Returns an unregister fn
 * so the effect can clean up on unmount.
 */
export function registerShaderFlip(cb: ShaderFlipCallback): () => void {
  shaderFlipCallback = cb;
  return () => {
    if (shaderFlipCallback === cb) shaderFlipCallback = null;
  };
}

// View Transitions API feature detection — typed narrowly because the API
// lives on Document but isn't yet in lib.dom.d.ts for all our TS targets.
type StartViewTransition = (cb: () => void) => {
  finished: Promise<void>;
  ready: Promise<void>;
  updateCallbackDone: Promise<void>;
};
function getStartViewTransition(): StartViewTransition | null {
  if (typeof document === "undefined") return null;
  const fn = (document as unknown as { startViewTransition?: StartViewTransition })
    .startViewTransition;
  return typeof fn === "function" ? fn.bind(document) : null;
}

// ─────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────

interface ThemeContextValue {
  theme: Theme;
  /**
   * Flip the theme. Pass the crest button so radial sunlight (void→day) and
   * void shadow (day→void) expand from its centre. Without an origin, the
   * viewport centre/top band is used.
   */
  toggleTheme: (originElement?: HTMLElement) => void;
  /** True during the flip window. Consumers (Navbar N° chip) use this to guard a crossfade. */
  isFlipping: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within <ThemeProvider>");
  }
  return ctx;
}

// ─────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────

export default function ThemeProvider({ children }: { children: ReactNode }) {
  // Initial state read from the DOM — the pre-hydration script in
  // layout.tsx has already set data-theme before first paint, so
  // this matches the SSR-rendered markup and avoids hydration drift.
  const [theme, setTheme] = useState<Theme>("void");
  const [isFlipping, setIsFlipping] = useState(false);

  // Guards a second toggle landing mid-transition (would desync
  // CSS crossfade and shader lerp). Ref, not state, so it updates
  // synchronously inside the click handler.
  const flipLockRef = useRef(false);
  const flipTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync React state to whatever the pre-hydration script set.
  // Use startTransition to avoid the "setState synchronously in effect" warning.
  useEffect(() => {
    const attr = document.documentElement.getAttribute("data-theme");
    if (attr === "day" || attr === "void") {
      React.startTransition(() => { setTheme(attr); });
    } else {
      // Attribute missing (script failed or dev tooling stripped it).
      // Fall back to storage, then default.
      const stored = sessionStorage.getItem(STORAGE_KEY);
      const fallback: Theme = stored === "day" ? "day" : "void";
      document.documentElement.setAttribute("data-theme", fallback);
      React.startTransition(() => { setTheme(fallback); });
    }
  }, []);

  const toggleTheme = useCallback(
    (originElement?: HTMLElement) => {
      if (flipLockRef.current) return;
      flipLockRef.current = true;

      const current = theme;
      const next: Theme = current === "void" ? "day" : "void";

      // The actual DOM mutation — same for both paths. Packaged as a closure
      // so View Transitions can call it inside startViewTransition's update
      // callback (where the browser brackets a before/after DOM snapshot).
      const applyFlip = (instant: boolean) => {
        document.documentElement.setAttribute("data-theme", next);
        shaderFlipCallback?.(next, instant);
        // flushSync forces React to commit the theme state update synchronously.
        // Required under View Transitions — the browser snapshots <html> the
        // moment this callback returns, so any theme-state-driven DOM (e.g. the
        // Navbar N°01↔N°02 crossfade spans) must be rendered with the NEW
        // state before snapshot, or the NEW snapshot captures stale content
        // and the label appears to "snap" at the end of the wipe.
        flushSync(() => {
          setTheme(next);
        });
        try {
          sessionStorage.setItem(STORAGE_KEY, next);
        } catch {
          // sessionStorage can throw in private-browsing / sandboxed iframes.
          // Persistence failure is non-fatal — the theme still flips for the session.
        }
      };

      setIsFlipping(true);
      setFlipOriginCss(originElement);

      if (next === "void") {
        // ══ SET (day → void) — shadow-consume overlay ══
        // All animation is rendered by <ShadowConsumeOverlay /> under
        // GLSL. This branch is pure orchestration: trigger the shader,
        // swap data-theme at the "peak" promise (full-black cover),
        // release the lock at the "finished" promise.
        //
        // Fallback: if the overlay component isn't mounted (SSR edge,
        // early error) we skip straight to applyFlip so the theme
        // still swaps — the user just won't see the cinematic.
        document.documentElement.setAttribute("data-flip-direction", "set");

        const originX = originElement
          ? originElement.getBoundingClientRect().left +
            originElement.getBoundingClientRect().width / 2
          : window.innerWidth / 2;
        const originY = originElement
          ? originElement.getBoundingClientRect().top +
            originElement.getBoundingClientRect().height / 2
          : Math.min(96, window.innerHeight * 0.12);

        const trigger = shadowConsumeCallback;
        if (!trigger) {
          applyFlip(false);
          document.documentElement.removeAttribute("data-flip-direction");
          clearFlipOriginCss();
          setIsFlipping(false);
          flipLockRef.current = false;
          return;
        }

        const { peak, finished } = trigger(originX, originY);

        // Shader lerp starts NOW, not at peak. It has the full
        // envelope (~1880ms) to reach the void palette so when the
        // shadow pulls back, the background is already in position
        // and there's no lingering cream peeking through.
        shaderFlipCallback?.(next, false);

        peak.then(() => {
          // data-theme + React state swap under full cover.
          // We bypass applyFlip's shader call (already fired above)
          // and write the state directly.
          document.documentElement.setAttribute("data-theme", next);
          flushSync(() => {
            setTheme(next);
          });
          try {
            sessionStorage.setItem(STORAGE_KEY, next);
          } catch {
            // sessionStorage can throw in sandboxed iframes. Swap is
            // in place either way.
          }
        });

        finished.then(() => {
          document.documentElement.removeAttribute("data-flip-direction");
          clearFlipOriginCss();
          setIsFlipping(false);
          flipLockRef.current = false;
        });
        return;
      }

      // ══ RISE (void → day) — View Transitions crest-radial sunrise ══
      const startViewTransition = getStartViewTransition();
      if (startViewTransition) {
        document.documentElement.setAttribute("data-flip-direction", "rise");
        const tx = startViewTransition(() => applyFlip(true));
        const cleanup = () => {
          clearFlipOriginCss();
          document.documentElement.removeAttribute("data-flip-direction");
          setIsFlipping(false);
          flipLockRef.current = false;
        };
        tx.finished.then(cleanup, cleanup);
      } else {
        // Fallback for browsers without View Transitions: global crossfade
        // via body.theme-flipping. Crest origin still set for the shader.
        document.documentElement.setAttribute("data-flip-direction", "rise");
        document.body.classList.add("theme-flipping");
        applyFlip(false);

        if (flipTimeoutRef.current) clearTimeout(flipTimeoutRef.current);
        flipTimeoutRef.current = setTimeout(() => {
          document.body.classList.remove("theme-flipping");
          document.documentElement.removeAttribute("data-flip-direction");
          clearFlipOriginCss();
          setIsFlipping(false);
          flipLockRef.current = false;
        }, FLIP_DURATION_MS);
      }
    },
    [theme]
  );

  // Unmount cleanup — only the rise fallback owns a host-side timer.
  // The shadow-consume path is entirely driven by promises resolved
  // from inside the R3F frame loop (see ShadowConsumeOverlay), so
  // there's no residual timer for ThemeProvider to clear. If the
  // provider unmounts mid-shadow, the overlay's own useEffect
  // teardown unregisters the callback and the dangling promises
  // are garbage-collected with the active ref.
  useEffect(() => {
    return () => {
      if (flipTimeoutRef.current) clearTimeout(flipTimeoutRef.current);
    };
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isFlipping }}>
      {children}
    </ThemeContext.Provider>
  );
}
