// ═══════════════════════════════════════════════════════════════════════════
// HOLLOW KNIGHT STYLE BACKGROUND SHADER
// Layer 1: Ruined Background with Movement
//
// Reference: Hollow Knight profile select screen
// - Blue-gray atmospheric fog with soft depth
// - Soft, blurred architectural silhouettes at multiple depths  
// - Subtle parallax drift
// - Smooth volumetric fog layers
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
  // COLOR PALETTE - Carefully matched to Hollow Knight reference
  // Muted blue-gray tones with atmospheric depth
  // ─────────────────────────────────────────────────────────────
  const vec3 COLOR_VOID = vec3(0.04, 0.045, 0.06);        // Deepest shadow #0a0b0f
  const vec3 COLOR_DEEP = vec3(0.075, 0.085, 0.11);       // Dark areas #131622
  const vec3 COLOR_DARK = vec3(0.11, 0.125, 0.16);        // Dark fog #1c2029
  const vec3 COLOR_BASE = vec3(0.155, 0.175, 0.22);       // Base atmosphere #282d38
  const vec3 COLOR_MID = vec3(0.21, 0.24, 0.30);          // Mid fog #363d4d
  const vec3 COLOR_FOG = vec3(0.28, 0.32, 0.40);          // Visible fog #475266
  const vec3 COLOR_LIGHT = vec3(0.35, 0.40, 0.48);        // Light mist #59667a
  const vec3 COLOR_BRIGHT = vec3(0.42, 0.47, 0.55);       // Brightest fog #6b788c

  // ─────────────────────────────────────────────────────────────
  // NOISE FUNCTIONS - Smooth organic patterns
  // ─────────────────────────────────────────────────────────────
  
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float hash21(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }

  // Smooth value noise
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * f * (f * (f * 6.0 - 15.0) + 10.0); // Quintic interpolation for smoothness
    
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  // FBM for natural cloud patterns
  float fbm(vec2 p, int octaves) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    float maxValue = 0.0;
    
    for(int i = 0; i < 6; i++) {
      if(i >= octaves) break;
      value += amplitude * noise(p * frequency);
      maxValue += amplitude;
      frequency *= 2.0;
      amplitude *= 0.5;
    }
    
    return value / maxValue;
  }

  // Warped FBM for flowing, organic movement
  float warpedFbm(vec2 p, float time) {
    vec2 q = vec2(
      fbm(p + vec2(0.0, 0.0), 4),
      fbm(p + vec2(5.2, 1.3), 4)
    );
    
    vec2 r = vec2(
      fbm(p + 4.0 * q + vec2(1.7, 9.2) + 0.1 * time, 4),
      fbm(p + 4.0 * q + vec2(8.3, 2.8) + 0.08 * time, 4)
    );
    
    return fbm(p + 3.5 * r, 5);
  }

  // ─────────────────────────────────────────────────────────────
  // SOFT SHAPE FUNCTIONS - Blurred silhouettes like in reference
  // ─────────────────────────────────────────────────────────────
  
  // Soft vertical structure (pillar/column) with organic edges
  float softPillar(vec2 uv, float x, float width, float height, float softness, float seed) {
    float dist = abs(uv.x - x);
    
    // Add organic waviness to edges
    float waveOffset = noise(vec2(seed * 50.0, uv.y * 8.0)) * width * 0.3;
    waveOffset += noise(vec2(seed * 100.0, uv.y * 15.0)) * width * 0.15;
    float adjustedDist = dist + waveOffset * 0.5 - waveOffset * 0.25;
    
    // Soft edge gradient
    float pillarMask = 1.0 - smoothstep(width * 0.5, width * 0.5 + softness, adjustedDist);
    
    // Organic top edge with noise
    float topNoise = noise(vec2(uv.x * 20.0 + seed * 30.0, seed)) * 0.15;
    topNoise += noise(vec2(uv.x * 40.0 + seed * 60.0, seed * 2.0)) * 0.08;
    float adjustedHeight = height - topNoise;
    
    // Soft top falloff
    pillarMask *= 1.0 - smoothstep(adjustedHeight - softness * 2.0, adjustedHeight + softness, uv.y);
    
    // Ground contact
    pillarMask *= smoothstep(-0.02, 0.05, uv.y);
    
    // Slight width variation (wider at base)
    float baseWidening = smoothstep(0.3, 0.0, uv.y) * 0.2 + 1.0;
    pillarMask *= smoothstep(width * baseWidening, width * 0.4 * baseWidening, adjustedDist);
    
    return clamp(pillarMask, 0.0, 1.0);
  }

  // Soft arch shape
  float softArch(vec2 uv, float x, float width, float height, float softness) {
    vec2 p = vec2(uv.x - x, uv.y);
    
    // Simple arch using parabola-like shape
    float archWidth = width;
    float archHeight = height * 0.6;
    
    // Arch opening (parabolic)
    float normalizedX = p.x / archWidth;
    float archCurve = archHeight * (1.0 - normalizedX * normalizedX * 4.0);
    archCurve = max(0.0, archCurve);
    
    // Only show arch in upper portion
    float inArch = step(height * 0.25, p.y);
    float archOpening = smoothstep(archCurve - softness, archCurve + softness, p.y - height * 0.25) * inArch;
    
    // Frame around arch
    float frame = 1.0 - smoothstep(archWidth - softness, archWidth + softness, abs(p.x));
    frame *= smoothstep(-0.02, 0.05, p.y);
    frame *= 1.0 - smoothstep(height - softness, height + softness * 0.5, p.y);
    
    // Combine: frame minus the opening
    float arch = frame * mix(1.0, 0.2, archOpening);
    
    return clamp(arch, 0.0, 1.0);
  }

  // Soft irregular wall/mass
  float softWall(vec2 uv, float x, float width, float height, float softness, float seed) {
    float dist = abs(uv.x - x);
    
    // Very irregular top
    float topNoise = noise(vec2(uv.x * 15.0 + seed * 40.0, seed)) * 0.35;
    topNoise += noise(vec2(uv.x * 30.0 + seed * 80.0, seed * 2.0)) * 0.15;
    topNoise += noise(vec2(uv.x * 60.0 + seed * 120.0, seed * 3.0)) * 0.08;
    float adjustedHeight = height * (0.5 + topNoise);
    
    // Irregular sides
    float sideNoise = noise(vec2(seed * 25.0, uv.y * 10.0)) * 0.3;
    float adjustedWidth = width * (0.7 + sideNoise);
    
    // Soft edges
    float mask = 1.0 - smoothstep(adjustedWidth * 0.5, adjustedWidth * 0.5 + softness, dist);
    mask *= 1.0 - smoothstep(adjustedHeight - softness, adjustedHeight + softness * 0.5, uv.y);
    mask *= smoothstep(-0.02, 0.04, uv.y);
    
    return clamp(mask, 0.0, 1.0);
  }

  // ─────────────────────────────────────────────────────────────
  // MAIN COMPOSITION
  // ─────────────────────────────────────────────────────────────
  
  vec3 ruinedBackground(vec2 uv, float time) {
    
    // ══════════════════════════════════════════════════════════
    // BASE ATMOSPHERE - Soft gradient matching reference
    // ══════════════════════════════════════════════════════════
    
    // Center is slightly brighter, edges darker
    float centerGlow = 1.0 - length((uv - vec2(0.5, 0.55)) * vec2(1.2, 1.0)) * 0.7;
    centerGlow = smoothstep(0.0, 1.0, centerGlow);
    
    vec3 baseColor = mix(COLOR_DARK, COLOR_BASE, centerGlow);
    
    // Slight vertical gradient - darker at very bottom and top
    float vGrad = smoothstep(0.0, 0.3, uv.y) * smoothstep(1.0, 0.7, uv.y);
    baseColor = mix(COLOR_DEEP, baseColor, vGrad * 0.7 + 0.3);
    
    vec3 color = baseColor;
    
    // ══════════════════════════════════════════════════════════
    // PARALLAX DRIFT VALUES - Slow, subtle movement
    // ══════════════════════════════════════════════════════════
    float slowTime = time * 0.08;
    float drift1 = sin(slowTime * 0.4) * 0.008;
    float drift2 = sin(slowTime * 0.6 + 1.0) * 0.012;
    float drift3 = sin(slowTime * 0.8 + 2.0) * 0.018;
    float drift4 = sin(slowTime * 1.0 + 3.0) * 0.025;

    // ══════════════════════════════════════════════════════════
    // LAYER 1: FAR ATMOSPHERIC HAZE
    // ══════════════════════════════════════════════════════════
    {
      vec2 fogUV = uv + vec2(drift1 * 0.5, 0.0);
      float fog = warpedFbm(fogUV * 1.2 + time * 0.005, time * 0.3);
      fog = smoothstep(0.35, 0.65, fog);
      
      // Concentrated in middle band
      float band = smoothstep(0.15, 0.45, uv.y) * smoothstep(0.9, 0.55, uv.y);
      fog *= band;
      
      color = mix(color, COLOR_MID, fog * 0.25);
    }
    
    // ══════════════════════════════════════════════════════════
    // LAYER 2: FAR RUINS - Very faded, barely visible
    // ══════════════════════════════════════════════════════════
    {
      vec2 ruinUV = uv + vec2(drift1, 0.0);
      float ruins = 0.0;
      float soft = 0.06; // Very soft/blurry
      float opacity = 0.18; // Very faded
      
      // Distant scattered pillars
      ruins += softPillar(ruinUV, 0.08, 0.04, 0.75, soft, 1.0) * opacity;
      ruins += softPillar(ruinUV, 0.22, 0.035, 0.62, soft, 2.0) * opacity;
      ruins += softPillar(ruinUV, 0.38, 0.03, 0.68, soft, 3.0) * opacity;
      ruins += softPillar(ruinUV, 0.52, 0.032, 0.58, soft, 4.0) * opacity;
      ruins += softPillar(ruinUV, 0.68, 0.038, 0.65, soft, 5.0) * opacity;
      ruins += softPillar(ruinUV, 0.82, 0.034, 0.72, soft, 6.0) * opacity;
      ruins += softPillar(ruinUV, 0.95, 0.042, 0.60, soft, 7.0) * opacity;
      
      // Far wall masses
      ruins += softWall(ruinUV, 0.15, 0.12, 0.45, soft, 10.0) * opacity * 0.6;
      ruins += softWall(ruinUV, 0.45, 0.08, 0.40, soft, 11.0) * opacity * 0.5;
      ruins += softWall(ruinUV, 0.75, 0.10, 0.42, soft, 12.0) * opacity * 0.6;
      
      color = mix(color, COLOR_VOID, ruins);
    }
    
    // ══════════════════════════════════════════════════════════
    // LAYER 3: MID ATMOSPHERIC FOG
    // ══════════════════════════════════════════════════════════
    {
      vec2 fogUV = uv + vec2(drift2 * 0.7, sin(time * 0.03) * 0.005);
      
      float fog1 = fbm(fogUV * 2.5 + vec2(time * 0.012, 0.0), 5);
      float fog2 = fbm(fogUV * 3.5 + vec2(-time * 0.008, time * 0.004), 4);
      float fog = fog1 * 0.6 + fog2 * 0.4;
      fog = smoothstep(0.3, 0.7, fog);
      
      // Bands of thicker fog
      float band1 = smoothstep(0.2, 0.38, uv.y) * smoothstep(0.55, 0.38, uv.y);
      float band2 = smoothstep(0.5, 0.65, uv.y) * smoothstep(0.85, 0.68, uv.y);
      fog *= (band1 + band2 * 0.7);
      
      color = mix(color, COLOR_FOG, fog * 0.28);
    }
    
    // ══════════════════════════════════════════════════════════
    // LAYER 4: MID RUINS - More visible
    // ══════════════════════════════════════════════════════════
    {
      vec2 ruinUV = uv + vec2(drift2, 0.0);
      float ruins = 0.0;
      float soft = 0.045;
      float opacity = 0.32;
      
      // Edge pillars (partially visible at screen edges)
      ruins += softPillar(ruinUV, -0.02, 0.055, 0.85, soft, 20.0) * opacity;
      ruins += softPillar(ruinUV, 1.02, 0.05, 0.82, soft, 21.0) * opacity;
      
      // Interior pillars
      ruins += softPillar(ruinUV, 0.12, 0.04, 0.58, soft, 22.0) * opacity * 0.8;
      ruins += softPillar(ruinUV, 0.30, 0.035, 0.52, soft, 23.0) * opacity * 0.7;
      ruins += softPillar(ruinUV, 0.70, 0.038, 0.55, soft, 24.0) * opacity * 0.7;
      ruins += softPillar(ruinUV, 0.88, 0.042, 0.60, soft, 25.0) * opacity * 0.8;
      
      // Arch structure in center-ish area
      ruins += softArch(ruinUV, 0.5, 0.10, 0.55, soft) * opacity * 0.6;
      
      // Connecting wall fragments
      ruins += softWall(ruinUV, 0.06, 0.10, 0.38, soft, 30.0) * opacity * 0.5;
      ruins += softWall(ruinUV, 0.94, 0.09, 0.35, soft, 31.0) * opacity * 0.5;
      
      color = mix(color, COLOR_DEEP, ruins);
    }
    
    // ══════════════════════════════════════════════════════════
    // LAYER 5: NEAR FOG WISPS
    // ══════════════════════════════════════════════════════════
    {
      vec2 fogUV = uv + vec2(drift3, sin(time * 0.04 + uv.x * 2.5) * 0.008);
      
      float fog = fbm(fogUV * 4.0 + vec2(time * 0.02, time * 0.008), 4);
      fog = smoothstep(0.42, 0.72, fog);
      
      // Wisps in lower and mid areas
      float wispMask = smoothstep(0.05, 0.25, uv.y) * smoothstep(0.55, 0.32, uv.y);
      wispMask += smoothstep(0.58, 0.72, uv.y) * smoothstep(0.92, 0.78, uv.y) * 0.5;
      fog *= wispMask;
      
      color = mix(color, COLOR_LIGHT, fog * 0.22);
    }
    
    // ══════════════════════════════════════════════════════════
    // LAYER 6: FOREGROUND RUINS - Darkest, closest
    // ══════════════════════════════════════════════════════════
    {
      vec2 ruinUV = uv + vec2(drift4, 0.0);
      float ruins = 0.0;
      float soft = 0.03; // Sharper than far layers
      float opacity = 0.55;
      
      // Large edge structures (mostly off-screen)
      ruins += softPillar(ruinUV, -0.08, 0.09, 0.92, soft, 40.0) * opacity;
      ruins += softPillar(ruinUV, 1.08, 0.085, 0.88, soft, 41.0) * opacity;
      
      // Near wall bases
      ruins += softWall(ruinUV, -0.02, 0.14, 0.32, soft, 50.0) * opacity * 0.7;
      ruins += softWall(ruinUV, 1.02, 0.13, 0.30, soft, 51.0) * opacity * 0.7;
      
      color = mix(color, COLOR_VOID, ruins);
    }
    
    // ══════════════════════════════════════════════════════════
    // LAYER 7: FOREGROUND WISPY FOG
    // ══════════════════════════════════════════════════════════
    {
      vec2 fogUV = uv + vec2(drift4 * 1.2, 0.0);
      
      float fog = fbm(fogUV * 6.0 + vec2(time * 0.03, 0.0), 3);
      fog = smoothstep(0.48, 0.78, fog);
      
      // Only at edges and bottom
      float edgeMask = smoothstep(0.3, 0.0, uv.x) + smoothstep(0.7, 1.0, uv.x);
      edgeMask += smoothstep(0.25, 0.0, uv.y);
      edgeMask = min(edgeMask, 1.0);
      fog *= edgeMask * 0.5;
      
      color = mix(color, COLOR_LIGHT, fog * 0.15);
    }
    
    // ══════════════════════════════════════════════════════════
    // SUBTLE FILM GRAIN
    // ══════════════════════════════════════════════════════════
    {
      float grain = hash21(uv * 800.0 + fract(time * 0.1) * 100.0);
      grain = (grain - 0.5) * 0.025;
      color += grain;
    }
    
    // ══════════════════════════════════════════════════════════
    // SOFT VIGNETTE - Darker at edges
    // ══════════════════════════════════════════════════════════
    {
      vec2 vigUV = (uv - 0.5) * 2.0;
      float vig = 1.0 - dot(vigUV * vec2(0.8, 1.0), vigUV * vec2(0.8, 1.0)) * 0.35;
      vig = smoothstep(0.0, 1.0, vig);
      color *= vig * 0.25 + 0.75;
    }
    
    return clamp(color, 0.0, 1.0);
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
