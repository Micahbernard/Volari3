// ═══════════════════════════════════════════════════════════════════════════
// HOLLOW KNIGHT STYLE BACKGROUND SHADER
// Layer 1: Ruined Background with Movement
//
// Reference: Hollow Knight profile select screen
// - Blue-gray atmospheric fog (NOT pure black)
// - Gothic ruined architecture silhouettes at multiple depths
// - Subtle parallax drift/sway
// - Dense volumetric fog creating depth layers
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
  // COLOR PALETTE - Matched to Hollow Knight reference images
  // Blue-gray mist tones, NOT pure black
  // ─────────────────────────────────────────────────────────────
  const vec3 COLOR_DEEPEST = vec3(0.06, 0.07, 0.10);      // Darkest areas #10121a
  const vec3 COLOR_DARK = vec3(0.10, 0.11, 0.16);         // Dark fog #1a1c29
  const vec3 COLOR_BASE = vec3(0.14, 0.16, 0.22);         // Base atmosphere #242938
  const vec3 COLOR_MID = vec3(0.20, 0.23, 0.30);          // Mid fog #333a4d
  const vec3 COLOR_LIGHT = vec3(0.28, 0.32, 0.42);        // Lighter mist #47526b
  const vec3 COLOR_BRIGHT = vec3(0.38, 0.44, 0.55);       // Brightest fog wisps #61708c
  const vec3 COLOR_SILHOUETTE = vec3(0.04, 0.05, 0.07);   // Ruin silhouettes #0a0c12

  // ─────────────────────────────────────────────────────────────
  // NOISE FUNCTIONS
  // ─────────────────────────────────────────────────────────────
  
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float hash21(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }

  // Smooth 2D noise
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  // Fractal Brownian Motion - organic cloud-like patterns
  float fbm(vec2 p, int octaves) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    float maxValue = 0.0;
    
    for(int i = 0; i < 8; i++) {
      if(i >= octaves) break;
      value += amplitude * noise(p * frequency);
      maxValue += amplitude;
      frequency *= 2.0;
      amplitude *= 0.5;
    }
    
    return value / maxValue;
  }

  // Warped FBM for more organic movement
  float warpedFbm(vec2 p, float time, int octaves) {
    vec2 q = vec2(
      fbm(p + vec2(0.0, 0.0), octaves),
      fbm(p + vec2(5.2, 1.3), octaves)
    );
    
    vec2 r = vec2(
      fbm(p + 4.0 * q + vec2(1.7, 9.2) + 0.15 * time, octaves),
      fbm(p + 4.0 * q + vec2(8.3, 2.8) + 0.126 * time, octaves)
    );
    
    return fbm(p + 4.0 * r, octaves);
  }

  // ─────────────────────────────────────────────────────────────
  // ARCHITECTURAL SHAPES - More detailed gothic structures
  // ─────────────────────────────────────────────────────────────
  
  // Detailed pillar with capital and base
  float pillar(vec2 uv, float x, float width, float height, float decay) {
    float dist = abs(uv.x - x);
    
    // Main shaft
    float shaft = smoothstep(width, width * 0.85, dist);
    
    // Capital (wider top section)
    float capitalY = height - 0.05;
    float inCapital = smoothstep(capitalY - 0.02, capitalY, uv.y) * smoothstep(height, capitalY, uv.y);
    float capitalWidth = width * 1.4;
    float capital = smoothstep(capitalWidth, capitalWidth * 0.9, dist) * inCapital;
    
    // Base (wider bottom section)
    float inBase = smoothstep(0.08, 0.03, uv.y);
    float baseWidth = width * 1.3;
    float base = smoothstep(baseWidth, baseWidth * 0.9, dist) * inBase;
    
    float pillarMask = max(shaft, max(capital, base));
    
    // Crumbled/jagged top edge
    float topNoise = noise(vec2(uv.x * 40.0 + x * 100.0, 0.0)) * decay;
    float adjustedHeight = height - topNoise * 0.12;
    pillarMask *= smoothstep(adjustedHeight + 0.01, adjustedHeight - 0.01, uv.y);
    
    // Bottom cutoff
    pillarMask *= smoothstep(0.0, 0.02, uv.y);
    
    // Add edge detail/erosion
    float erosion = noise(vec2(uv.x * 60.0, uv.y * 30.0)) * decay * 0.3;
    pillarMask *= 1.0 - erosion;
    
    return clamp(pillarMask, 0.0, 1.0);
  }

  // Gothic pointed arch
  float gothicArch(vec2 uv, float x, float width, float height, float thickness) {
    vec2 p = vec2(uv.x - x, uv.y);
    
    // Two circular arcs meeting at a point (gothic arch shape)
    float archStartY = height * 0.45;
    float radius = width * 1.2;
    
    // Left arc center
    vec2 leftCenter = vec2(-width * 0.3, archStartY);
    float leftDist = length(p - leftCenter);
    
    // Right arc center  
    vec2 rightCenter = vec2(width * 0.3, archStartY);
    float rightDist = length(p - rightCenter);
    
    // The arch opening is where BOTH distances are less than radius
    float archOpening = 1.0 - smoothstep(radius - 0.02, radius, min(leftDist, rightDist));
    archOpening *= step(archStartY * 0.5, p.y); // Only above certain height
    
    // Outer frame
    float frame = smoothstep(width + thickness, width, abs(p.x));
    frame *= smoothstep(0.0, 0.02, uv.y);
    frame *= smoothstep(height + 0.01, height - 0.01, uv.y);
    
    // Subtract opening from frame
    float arch = frame * (1.0 - archOpening * 0.85);
    
    return clamp(arch, 0.0, 1.0);
  }

  // Ruined wall with irregular top
  float ruinedWall(vec2 uv, float x, float width, float baseHeight, float seed) {
    float dist = abs(uv.x - x);
    
    // Irregular top edge using noise
    float topVariation = noise(vec2(uv.x * 25.0 + seed * 50.0, seed)) * 0.25;
    topVariation += noise(vec2(uv.x * 50.0 + seed * 100.0, seed * 2.0)) * 0.1;
    float height = baseHeight * (0.6 + topVariation);
    
    // Width variation (crumbling sides)
    float sideNoise = noise(vec2(seed * 30.0, uv.y * 15.0)) * 0.15;
    float adjustedWidth = width * (1.0 - sideNoise);
    
    float mask = smoothstep(adjustedWidth, adjustedWidth * 0.9, dist);
    mask *= smoothstep(height + 0.005, height - 0.005, uv.y);
    mask *= smoothstep(0.0, 0.02, uv.y);
    
    // Random holes/gaps in the wall
    float holes = noise(vec2(uv.x * 40.0 + seed * 20.0, uv.y * 25.0));
    holes = smoothstep(0.7, 0.8, holes);
    mask *= 1.0 - holes * 0.7;
    
    return clamp(mask, 0.0, 1.0);
  }

  // Window frame (empty rectangle)
  float windowFrame(vec2 uv, float x, float y, float w, float h, float thickness) {
    vec2 p = uv - vec2(x, y);
    
    // Outer rectangle
    float outer = step(-w, p.x) * step(p.x, w) * step(-h, p.y) * step(p.y, h);
    
    // Inner rectangle (the opening)
    float innerW = w - thickness;
    float innerH = h - thickness;
    float inner = step(-innerW, p.x) * step(p.x, innerW) * step(-innerH, p.y) * step(p.y, innerH);
    
    return outer - inner;
  }

  // ─────────────────────────────────────────────────────────────
  // LAYER COMPOSITION
  // ─────────────────────────────────────────────────────────────
  
  vec3 ruinedBackground(vec2 uv, float time) {
    // ══════════════════════════════════════════════════════════
    // BASE ATMOSPHERE - Blue-gray gradient (not black!)
    // ══════════════════════════════════════════════════════════
    
    // Vertical gradient - lighter in upper-middle, darker at edges
    float vertGrad = smoothstep(0.0, 0.5, uv.y) * smoothstep(1.0, 0.4, uv.y);
    vec3 baseColor = mix(COLOR_DARK, COLOR_BASE, vertGrad);
    
    // Add horizontal variation
    float horizVar = sin(uv.x * 3.14159) * 0.5 + 0.5;
    baseColor = mix(baseColor, COLOR_MID, horizVar * 0.15);
    
    vec3 color = baseColor;
    
    // ══════════════════════════════════════════════════════════
    // PARALLAX MOVEMENT VALUES
    // ══════════════════════════════════════════════════════════
    float drift1 = sin(time * 0.05) * 0.015;  // Slowest - far layer
    float drift2 = sin(time * 0.07 + 1.0) * 0.02;  // Medium
    float drift3 = sin(time * 0.09 + 2.0) * 0.025; // Faster - near layer
    
    // ══════════════════════════════════════════════════════════
    // FAR BACKGROUND FOG (Layer 0) - Deepest atmospheric haze
    // ══════════════════════════════════════════════════════════
    {
      vec2 fogUV = uv + vec2(drift1 * 0.3, 0.0);
      float fog = warpedFbm(fogUV * 1.5 + time * 0.008, time * 0.5, 4);
      fog = smoothstep(0.25, 0.75, fog);
      
      // Stronger in center band
      float band = smoothstep(0.1, 0.4, uv.y) * smoothstep(0.95, 0.6, uv.y);
      fog *= band * 0.6 + 0.4;
      
      color = mix(color, COLOR_MID, fog * 0.3);
    }
    
    // ══════════════════════════════════════════════════════════
    // FAR RUINS SILHOUETTE (Layer 1) - Barely visible distant structures
    // ══════════════════════════════════════════════════════════
    {
      vec2 ruinUV = uv + vec2(drift1, 0.0);
      float ruins = 0.0;
      float depth = 0.25; // How dark/visible (lower = more faded)
      
      // Distant pillars across the back
      ruins += pillar(ruinUV, 0.05, 0.018, 0.72, 0.3) * depth;
      ruins += pillar(ruinUV, 0.18, 0.022, 0.58, 0.5) * depth;
      ruins += pillar(ruinUV, 0.35, 0.015, 0.65, 0.4) * depth;
      
      // Central arch structure
      ruins += gothicArch(ruinUV, 0.5, 0.08, 0.6, 0.025) * depth * 0.8;
      
      // Right side structures
      ruins += pillar(ruinUV, 0.65, 0.016, 0.62, 0.45) * depth;
      ruins += pillar(ruinUV, 0.82, 0.02, 0.55, 0.5) * depth;
      ruins += pillar(ruinUV, 0.95, 0.019, 0.68, 0.35) * depth;
      
      // Connecting wall fragments
      ruins += ruinedWall(ruinUV, 0.26, 0.05, 0.42, 1.0) * depth * 0.6;
      ruins += ruinedWall(ruinUV, 0.74, 0.06, 0.38, 2.0) * depth * 0.6;
      
      // Silhouettes slightly darker than background
      color = mix(color, COLOR_SILHOUETTE, ruins * 0.5);
    }
    
    // ══════════════════════════════════════════════════════════
    // MID FOG LAYER (Layer 2) - Obscuring mist
    // ══════════════════════════════════════════════════════════
    {
      vec2 fogUV = uv + vec2(drift2 * 0.6, sin(time * 0.04) * 0.008);
      
      // Multi-layer fog
      float fog1 = fbm(fogUV * 3.0 + vec2(time * 0.015, 0.0), 5);
      float fog2 = fbm(fogUV * 4.5 + vec2(-time * 0.01, time * 0.005), 4);
      float fog = fog1 * 0.65 + fog2 * 0.35;
      fog = smoothstep(0.3, 0.7, fog);
      
      // Horizontal bands of thicker fog
      float band1 = smoothstep(0.15, 0.35, uv.y) * smoothstep(0.55, 0.35, uv.y);
      float band2 = smoothstep(0.45, 0.65, uv.y) * smoothstep(0.85, 0.65, uv.y);
      fog *= (band1 + band2) * 0.5 + 0.3;
      
      color = mix(color, COLOR_LIGHT, fog * 0.35);
    }
    
    // ══════════════════════════════════════════════════════════
    // MID RUINS SILHOUETTE (Layer 3) - More prominent structures
    // ══════════════════════════════════════════════════════════
    {
      vec2 ruinUV = uv + vec2(drift2, 0.0);
      float ruins = 0.0;
      float depth = 0.45; // More visible than far layer
      
      // Edge pillars (frame the view)
      ruins += pillar(ruinUV, -0.03, 0.04, 0.82, 0.2) * depth;
      ruins += pillar(ruinUV, 1.03, 0.038, 0.78, 0.25) * depth;
      
      // Secondary pillars
      ruins += pillar(ruinUV, 0.12, 0.028, 0.55, 0.4) * depth * 0.7;
      ruins += pillar(ruinUV, 0.88, 0.026, 0.52, 0.45) * depth * 0.7;
      
      // Ruined walls on sides
      ruins += ruinedWall(ruinUV, 0.08, 0.09, 0.38, 3.0) * depth * 0.5;
      ruins += ruinedWall(ruinUV, 0.92, 0.085, 0.35, 4.0) * depth * 0.5;
      
      // Window frames in walls
      ruins += windowFrame(ruinUV, 0.1, 0.25, 0.02, 0.04, 0.008) * depth * 0.3;
      ruins += windowFrame(ruinUV, 0.9, 0.22, 0.018, 0.035, 0.007) * depth * 0.3;
      
      color = mix(color, COLOR_SILHOUETTE, ruins * 0.65);
    }
    
    // ══════════════════════════════════════════════════════════
    // NEAR FOG WISPS (Layer 4) - Foreground atmospheric wisps
    // ══════════════════════════════════════════════════════════
    {
      vec2 fogUV = uv + vec2(drift3, sin(time * 0.06 + uv.x * 3.0) * 0.012);
      
      float fog = fbm(fogUV * 5.0 + vec2(time * 0.025, time * 0.01), 4);
      fog = smoothstep(0.4, 0.75, fog);
      
      // Wisps concentrated in lower-mid and upper areas
      float wispMask = smoothstep(0.1, 0.3, uv.y) * smoothstep(0.5, 0.3, uv.y);
      wispMask += smoothstep(0.6, 0.75, uv.y) * smoothstep(0.95, 0.8, uv.y) * 0.6;
      fog *= wispMask;
      
      color = mix(color, COLOR_BRIGHT, fog * 0.2);
    }
    
    // ══════════════════════════════════════════════════════════
    // FOREGROUND RUINS (Layer 5) - Closest, darkest silhouettes  
    // ══════════════════════════════════════════════════════════
    {
      vec2 ruinUV = uv + vec2(drift3, 0.0);
      float ruins = 0.0;
      float depth = 0.7; // Very prominent
      
      // Large edge structures (partially off-screen)
      ruins += pillar(ruinUV, -0.06, 0.065, 0.88, 0.15) * depth;
      ruins += pillar(ruinUV, 1.06, 0.06, 0.85, 0.18) * depth;
      
      // Crumbling wall bases
      ruins += ruinedWall(ruinUV, 0.02, 0.12, 0.28, 5.0) * depth * 0.6;
      ruins += ruinedWall(ruinUV, 0.98, 0.11, 0.25, 6.0) * depth * 0.6;
      
      color = mix(color, COLOR_DEEPEST, ruins * 0.85);
    }
    
    // ══════════════════════════════════════════════════════════
    // ATMOSPHERIC GRAIN - Subtle texture
    // ══════════════════════════════════════════════════════════
    {
      float grain = hash21(uv * 500.0 + time * 0.1) * 0.03;
      color += grain - 0.015;
    }
    
    // ══════════════════════════════════════════════════════════
    // VIGNETTE - Subtle darkening at edges
    // ══════════════════════════════════════════════════════════
    {
      vec2 vigUV = (uv - 0.5) * 2.0;
      float vig = 1.0 - dot(vigUV, vigUV) * 0.25;
      vig = smoothstep(0.0, 1.0, vig);
      color *= vig * 0.3 + 0.7;
    }
    
    return color;
  }

  // ─────────────────────────────────────────────────────────────
  // MAIN
  // ─────────────────────────────────────────────────────────────
  
  void main() {
    vec2 uv = vUv;
    
    vec3 color = ruinedBackground(uv, uTime);
    
    gl_FragColor = vec4(color, 1.0);
  }
`;
