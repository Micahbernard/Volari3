// ═══════════════════════════════════════════════════════════════════════════
// HOLLOW KNIGHT STYLE BACKGROUND SHADER
// Layer 1: Ruined Background with Movement
//
// Reference: Hollow Knight profile select screen
// - Dark blue-gray atmospheric fog
// - Gothic ruined architecture silhouettes
// - Subtle parallax drift/sway
// - Multiple depth layers creating volumetric depth
// ═══════════════════════════════════════════════════════════════════════════

export const vertexShader = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const fragmentShader = /* glsl */ `
  precision highp float;
  
  uniform float uTime;
  uniform vec2 uResolution;
  uniform vec2 uMouse;
  
  varying vec2 vUv;

  // ─────────────────────────────────────────────────────────────
  // COLOR PALETTE - Hollow Knight Abyss/Menu
  // ─────────────────────────────────────────────────────────────
  // Deep blacks and cold blue-grays
  const vec3 COLOR_VOID = vec3(0.02, 0.02, 0.03);        // Near black base
  const vec3 COLOR_DEEP = vec3(0.04, 0.045, 0.06);       // Deep fog
  const vec3 COLOR_MID = vec3(0.08, 0.09, 0.12);         // Mid fog
  const vec3 COLOR_LIGHT = vec3(0.14, 0.16, 0.22);       // Light fog highlights
  const vec3 COLOR_MIST = vec3(0.20, 0.24, 0.32);        // Brightest mist

  // ─────────────────────────────────────────────────────────────
  // NOISE FUNCTIONS
  // ─────────────────────────────────────────────────────────────
  
  // Simple hash for noise
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float hash(float n) {
    return fract(sin(n) * 43758.5453123);
  }

  // 2D Value noise
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f); // smoothstep
    
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  // Fractal Brownian Motion
  float fbm(vec2 p, int octaves) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    
    for(int i = 0; i < 6; i++) {
      if(i >= octaves) break;
      value += amplitude * noise(p * frequency);
      frequency *= 2.0;
      amplitude *= 0.5;
    }
    
    return value;
  }

  // ─────────────────────────────────────────────────────────────
  // ARCHITECTURAL SILHOUETTES
  // Creates gothic/ruined shapes suggestive of ancient structures
  // ─────────────────────────────────────────────────────────────
  
  // Pillar/column shape
  float pillar(vec2 uv, float x, float width, float height, float crumble) {
    // Base pillar shape
    float dist = abs(uv.x - x);
    float pillarMask = smoothstep(width, width * 0.8, dist);
    
    // Height cutoff with ragged top edge (crumbled)
    float topNoise = noise(vec2(uv.x * 20.0, 0.0)) * crumble;
    float top = height + topNoise * 0.1;
    pillarMask *= smoothstep(top + 0.02, top, uv.y);
    
    // Base always at bottom
    pillarMask *= smoothstep(0.0, 0.05, uv.y);
    
    return pillarMask;
  }

  // Gothic arch shape
  float arch(vec2 uv, float x, float width, float height) {
    vec2 p = uv - vec2(x, 0.0);
    
    // Arch opening (pointed gothic arch)
    float archWidth = width * 0.7;
    float archDist = length(vec2(p.x, max(0.0, p.y - height * 0.6)));
    float archCurve = smoothstep(archWidth, archWidth * 0.9, archDist);
    
    // Outer pillar bounds
    float outerMask = smoothstep(width, width * 0.95, abs(p.x));
    outerMask *= smoothstep(0.0, 0.02, uv.y);
    outerMask *= smoothstep(height + 0.02, height, uv.y);
    
    return max(0.0, outerMask - archCurve * 0.5);
  }

  // Ruined wall segment
  float ruinedWall(vec2 uv, float x, float width, float baseHeight) {
    float dist = abs(uv.x - x);
    
    // Jagged top edge using noise
    float edgeNoise = fbm(vec2(uv.x * 15.0, uTime * 0.01), 3);
    float height = baseHeight * (0.7 + edgeNoise * 0.3);
    
    float mask = smoothstep(width, width * 0.9, dist);
    mask *= smoothstep(height + 0.01, height, uv.y);
    mask *= smoothstep(0.0, 0.03, uv.y);
    
    return mask;
  }

  // ─────────────────────────────────────────────────────────────
  // LAYER 1: RUINED BACKGROUND
  // Far distance atmospheric layer with architectural hints
  // ─────────────────────────────────────────────────────────────
  
  vec3 ruinedBackground(vec2 uv, float time) {
    // Start with deep void color
    vec3 color = COLOR_VOID;
    
    // ── Parallax drift ──
    // Slow, gentle horizontal sway to create depth and life
    float drift = sin(time * 0.08) * 0.02;
    float drift2 = sin(time * 0.05 + 1.5) * 0.015;
    
    // ── LAYER: Far distant fog ──
    // Very back layer - nearly uniform dark with subtle variation
    {
      vec2 fogUV = uv + vec2(drift * 0.3, 0.0);
      float fog = fbm(fogUV * 2.0 + vec2(time * 0.01, 0.0), 4);
      fog = smoothstep(0.3, 0.7, fog);
      
      // Vertical gradient - lighter toward center-top
      float vertGrad = smoothstep(0.0, 0.7, uv.y) * smoothstep(1.0, 0.5, uv.y);
      fog *= vertGrad * 0.5 + 0.5;
      
      color = mix(color, COLOR_DEEP, fog * 0.4);
    }
    
    // ── LAYER: Distant ruins silhouette ──
    // Very faint architectural shapes in the far background
    {
      vec2 ruinUV = uv + vec2(drift * 0.5, 0.0);
      
      float ruins = 0.0;
      
      // Far left tall pillar (barely visible)
      ruins += pillar(ruinUV, 0.08, 0.025, 0.65, 0.4) * 0.3;
      
      // Center-left arch structure
      ruins += arch(ruinUV, 0.25, 0.06, 0.55) * 0.25;
      
      // Center pillars (subtle)
      ruins += pillar(ruinUV, 0.42, 0.02, 0.48, 0.6) * 0.2;
      ruins += pillar(ruinUV, 0.58, 0.018, 0.52, 0.5) * 0.2;
      
      // Right side ruins
      ruins += ruinedWall(ruinUV, 0.78, 0.08, 0.45) * 0.25;
      ruins += pillar(ruinUV, 0.92, 0.03, 0.58, 0.3) * 0.3;
      
      // Add noise breakup to silhouettes
      float breakup = noise(ruinUV * 30.0 + time * 0.02);
      ruins *= 0.8 + breakup * 0.2;
      
      // Silhouettes are DARKER than background
      color = mix(color, COLOR_VOID * 0.5, ruins * 0.6);
    }
    
    // ── LAYER: Mid-distance fog bank ──
    // Flowing fog that drifts and obscures
    {
      vec2 fogUV = uv + vec2(drift2, sin(time * 0.03) * 0.01);
      
      // Multi-octave fog for organic movement
      float fog1 = fbm(fogUV * 3.0 + vec2(time * 0.02, time * 0.01), 5);
      float fog2 = fbm(fogUV * 5.0 + vec2(-time * 0.015, time * 0.008), 4);
      
      float fog = fog1 * 0.6 + fog2 * 0.4;
      fog = smoothstep(0.35, 0.65, fog);
      
      // Concentrate fog in horizontal bands
      float band1 = smoothstep(0.2, 0.4, uv.y) * smoothstep(0.6, 0.4, uv.y);
      float band2 = smoothstep(0.5, 0.7, uv.y) * smoothstep(0.9, 0.7, uv.y);
      fog *= (band1 * 0.7 + band2 * 0.5 + 0.2);
      
      color = mix(color, COLOR_MID, fog * 0.35);
    }
    
    // ── LAYER: Closer ruins (mid-ground silhouettes) ──
    {
      vec2 ruinUV = uv + vec2(drift * 0.8, 0.0);
      
      float ruins = 0.0;
      
      // Larger, more prominent structures on edges
      ruins += pillar(ruinUV, -0.02, 0.05, 0.75, 0.2) * 0.5;
      ruins += pillar(ruinUV, 1.02, 0.045, 0.70, 0.25) * 0.5;
      
      // Crumbled wall sections
      ruins += ruinedWall(ruinUV, 0.15, 0.12, 0.35) * 0.35;
      ruins += ruinedWall(ruinUV, 0.85, 0.10, 0.32) * 0.35;
      
      // Break up with noise
      float breakup = noise(ruinUV * 25.0 + time * 0.03);
      ruins *= 0.85 + breakup * 0.15;
      
      color = mix(color, COLOR_VOID * 0.3, ruins * 0.7);
    }
    
    // ── LAYER: Near fog wisps ──
    // Closer, more defined fog drifting across
    {
      vec2 fogUV = uv + vec2(drift * 1.2, sin(time * 0.07 + uv.x * 2.0) * 0.015);
      
      float fog = fbm(fogUV * 6.0 + vec2(time * 0.03, 0.0), 4);
      fog = smoothstep(0.45, 0.75, fog);
      
      // Wisps are thinner, more horizontal
      float wispMask = smoothstep(0.3, 0.5, uv.y) * smoothstep(0.8, 0.5, uv.y);
      fog *= wispMask;
      
      color = mix(color, COLOR_LIGHT, fog * 0.25);
    }
    
    // ── Vignette ──
    // Darken edges to focus attention center
    {
      vec2 vigUV = uv - 0.5;
      float vig = 1.0 - dot(vigUV, vigUV) * 1.2;
      vig = smoothstep(0.0, 0.7, vig);
      color *= vig * 0.5 + 0.5;
    }
    
    // ── Subtle vertical gradient ──
    // Slightly lighter in center, darker at top and bottom edges
    {
      float grad = smoothstep(0.0, 0.4, uv.y) * smoothstep(1.0, 0.6, uv.y);
      color = mix(color * 0.85, color, grad);
    }
    
    return color;
  }

  // ─────────────────────────────────────────────────────────────
  // MAIN
  // ─────────────────────────────────────────────────────────────
  
  void main() {
    vec2 uv = vUv;
    float aspect = uResolution.x / uResolution.y;
    
    // Correct for aspect ratio in certain calculations
    vec2 uvCorrected = vec2(uv.x * aspect, uv.y);
    
    // Get ruined background
    vec3 color = ruinedBackground(uv, uTime);
    
    gl_FragColor = vec4(color, 1.0);
  }
`;
