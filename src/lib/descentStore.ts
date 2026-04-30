// ─────────────────────────────────────────────────────────────
// Descent progress bridge
//
// Module-level store — TheDescent writes scroll progress here,
// WebGLBackground reads it each frame to feed uDescent into the shader.
// Same pattern as ThemeProvider's registerShaderFlip.
// ─────────────────────────────────────────────────────────────

let descentProgress = 0;

/** Called by TheDescent on each scroll tick. 0 = hero level, 1 = abyss floor. */
export function setDescentProgress(value: number): void {
  descentProgress = value;
}

/** Called by WebGLBackground each frame to feed the shader uniform. */
export function getDescentProgress(): number {
  return descentProgress;
}
