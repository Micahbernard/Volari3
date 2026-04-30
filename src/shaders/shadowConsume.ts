// ─────────────────────────────────────────────────────────────
// Shadow-consume shader — day → void flip
//
// A fullscreen fragment shader that simulates a living, breathing
// darkness devouring the page from the crest origin outward.
//
// Composition, front to back:
//   1. A turbulent smoke body built from domain-warped fBm — three
//      nested noise passes so the "liquid" reads as thick ink that
//      rolls in on itself, not as a static pattern.
//   2. A tendril field sampled in polar coordinates around the
//      origin — produces long, twisting filaments that radiate
//      outward like fingers of shadow.
//   3. A radial consume front that expands with uProgress — smoke
//      and tendrils are masked to the interior of this front, which
//      carries a breathing feather for soft, organic dissolve edges.
//   4. A peak blackout that crossfades to solid black at the end of
//      the timeline — this is where the theme actually swaps, so
//      the mutation is never visible through partial transparency.
//
// Colour is deep matte black with a barely-perceptible cool-violet
// core (Destiny "Darkness" reference). No warm tones.
// ─────────────────────────────────────────────────────────────

/**
 * Vertex: pass-through for a fullscreen clip-space quad.
 * Expects a PlaneGeometry of size 2 (positions −1..1) so a single
 * mesh covers NDC regardless of camera. No matrix transforms applied.
 */
export const vertexShader = /* glsl */ `
  void main() {
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

/**
 * Fragment: the shadow-consume effect.
 *
 * Uniforms:
 *   uResolution — canvas size in pixels.
 *   uOrigin     — crest centre in pixel coords (top-left origin
 *                 from the browser; we invert Y internally).
 *   uTime       — seconds since Canvas mount; used for animated
 *                 noise offsets / breathing feather.
 *   uProgress   — 0..1 radial consume progression.
 *   uPeak       — 0..1 final blackout ramp (0 = shadow pattern,
 *                 1 = solid black).
 *   uActive     — master visibility 0..1 so the overlay fades in
 *                 and out cleanly at the edges of its lifecycle.
 *   uAspectBias — >0 stretches the smoke sample space vertically so
 *                 the consume feels like it has mass pulling down
 *                 from the horizon instead of reading as a circle.
 */
export const fragmentShader = /* glsl */ `
  precision highp float;

  uniform vec2  uResolution;
  uniform vec2  uOrigin;
  uniform float uTime;
  uniform float uProgress;
  uniform float uPeak;
  uniform float uActive;
  uniform float uAspectBias;

  // ───── Hash & value noise ─────
  // Single-float hash (Dave Hoskins-style) — cheap, decorrelated
  // enough for visual noise without needing sine-based collapses.
  float hash12(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }

  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    // Hermite smoothing — cheaper than quintic and visually adequate
    // for stacked fBm where high-frequency artefacts wash out.
    vec2 u = f * f * (3.0 - 2.0 * f);
    float a = hash12(i);
    float b = hash12(i + vec2(1.0, 0.0));
    float c = hash12(i + vec2(0.0, 1.0));
    float d = hash12(i + vec2(1.0, 1.0));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }

  // Rotated-octave fBm. The rotation matrix breaks axis-aligned
  // artefacts that stacked noise otherwise produces.
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    mat2 rot = mat2(0.80, 0.60, -0.60, 0.80);
    for (int i = 0; i < 6; i++) {
      v += a * vnoise(p);
      p = rot * p * 2.02;
      a *= 0.5;
    }
    return v;
  }

  // ───── Turbulent ink ─────
  // Two-level domain warp: offset position by fbm, then offset by
  // fbm of that warped position. The iterated warp is what gives
  // Destiny-style darkness its convecting, self-folding look —
  // flat noise reads as static, double-warp reads as fluid.
  float turbulentInk(vec2 p, float t) {
    vec2 q = vec2(
      fbm(p + 0.08 * t),
      fbm(p + vec2(3.1, 1.7) + 0.07 * t)
    );
    vec2 r = vec2(
      fbm(p + 3.2 * q + vec2(1.7, 9.2) - 0.11 * t),
      fbm(p + 3.2 * q + vec2(8.3, 2.8) + 0.09 * t)
    );
    return fbm(p + 4.0 * r);
  }

  // ───── Tendrils ─────
  // Sample noise in (angle, radius) polar space so patterns elongate
  // radially. Sharpen with smoothstep to turn blurry clouds into
  // thin filaments. Time shears the radial coordinate so tendrils
  // crawl outward (not just shimmer in place).
  float tendrils(vec2 p, float t, vec2 origin) {
    vec2 d = p - origin;
    float ang = atan(d.y, d.x);
    float rad = length(d);
    vec2 polar = vec2(ang * 2.2, rad * 4.5 - t * 1.05);
    float n = turbulentInk(polar, t * 0.55);
    // Sharpen — the difference between 0.44 and 0.78 gives thin
    // crest-to-trough streaks instead of soft fog. Slight contrast
    // boost via pow so the streaks feel inky rather than gauzy.
    float s = smoothstep(0.44, 0.78, n);
    return pow(s, 1.4);
  }

  void main() {
    // Screen UV in 0..1, with Y flipped so uOrigin (browser pixels,
    // top-left origin) maps correctly — gl_FragCoord's Y is
    // bottom-up by default.
    vec2 uv = gl_FragCoord.xy / uResolution.xy;
    uv.y = 1.0 - uv.y;

    float aspect = uResolution.x / uResolution.y;
    vec2 origin = uOrigin / uResolution.xy;

    // Aspect-correct so radial math reads as circles on any shape
    // of viewport. Multiply by (aspect, 1 + bias) so vertical range
    // is slightly stretched — makes the shadow feel taller than
    // wide, closer to "a curtain falling" than "a bubble growing".
    vec2 p = vec2(uv.x * aspect, uv.y * (1.0 + uAspectBias));
    vec2 o = vec2(origin.x * aspect, origin.y * (1.0 + uAspectBias));

    vec2 d = p - o;
    float dist = length(d);

    // ── Main ink body ──
    // Sample position is pulled toward the origin by a distance-
    // modulated offset, so the pattern appears to be getting sucked
    // inward. The scalar 2.2 controls ink frequency — higher =
    // finer detail, lower = broader cloud shapes.
    vec2 inkP = p * 2.4 + 0.55 * d / max(dist, 0.06);
    float ink = turbulentInk(inkP, uTime);
    ink = smoothstep(0.28, 0.88, ink);

    // ── Tendrils ──
    float tend = tendrils(p * 1.15, uTime, o);

    // ── Radial consume front ──
    // Scale the front to cover the full diagonal at progress = 1.
    // maxDim is the aspect-corrected diagonal length (so the front
    // reaches every corner for any viewport shape).
    float maxDim = sqrt(aspect * aspect + pow(1.0 + uAspectBias, 2.0));
    float frontRadius = uProgress * maxDim * 1.15;
    // Breathing feather — subtle sine modulation (~14% amplitude)
    // so the dissolve edge never reads as a crisp ring.
    float feather = 0.22 + 0.08 * sin(uTime * 2.6 + dist * 3.0);

    // smoothstep(high, low, ...) gives 1 inside the front and 0
    // outside, with the feather as the dissolve band.
    float frontMask = smoothstep(frontRadius + feather, frontRadius - feather, dist);

    // Tendrils reach slightly past the main front — that's the
    // "alive" signal: the silhouette isn't a clean disc, it has
    // filaments probing outward hunting for the light.
    float tendrilReach = smoothstep(frontRadius + 0.55, frontRadius - 0.05, dist);

    // ── Composite ──
    // Mix ink with 1.0 so the inside of the front is solid-ish, not
    // patchy. Pull it toward solid as the effect progresses.
    float interior = mix(0.58, 0.92, uProgress);
    float shadow = frontMask * mix(ink, 1.0, interior);

    // Tendrils lay on top with high opacity — they should read as
    // black, not gauze.
    shadow = max(shadow, tend * tendrilReach * 0.95);

    // Contrast shaping — early frames are gauzier, late frames are
    // opaque. pow exponent lerps from 1.5 (toothy) to 0.7 (solid).
    shadow = pow(shadow, mix(1.5, 0.7, uProgress));

    // ── Peak blackout ──
    // uPeak crossfades the entire shadow toward solid black, which
    // is the moment the theme swaps underneath. By the time uPeak
    // reaches 1, the fragment is pitch — the swap is invisible.
    shadow = mix(shadow, 1.0, uPeak);

    // Master visibility for clean mount/unmount edges.
    shadow *= uActive;

    // ── Colour ──
    // Deep matte black at the edges; a cool violet-tinged near-black
    // at the core. The shift is 1–2 bits off pure black — the viewer
    // registers "dark", not "tinted". Destiny's Darkness leans cool
    // rather than warm, so we bias blue over red.
    vec3 edgeBlack = vec3(0.008, 0.006, 0.012);
    vec3 coreBlack = vec3(0.024, 0.018, 0.036);
    float coreBlend = smoothstep(0.9, 0.0, dist / maxDim) * (1.0 - uPeak);
    vec3 tint = mix(edgeBlack, coreBlack, coreBlend);

    gl_FragColor = vec4(tint, shadow);
  }
`;
