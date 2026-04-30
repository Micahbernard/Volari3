// Ink-bleed page transition — FBM + distance field (volari-engineering-constraints: shader discipline)

export const inkBleedVertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const inkBleedFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform vec2 uResolution;
  uniform float uProgress;
  uniform float uNoiseScale;
  uniform float uEdgeSoftness;
  uniform float uGrainStrength;
  uniform float uDistortStrength;

  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
  }

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

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    vec2 shift = vec2(100.0);
    mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.50));
    for (int i = 0; i < 5; ++i) {
      v += a * noise(p);
      p = rot * p * 2.0 + shift;
      a *= 0.5;
    }
    return v;
  }

  float fbmSlow(vec2 p) {
    float v = 0.0;
    float a = 0.35;
    vec2 shift = vec2(37.0, 17.0);
    mat2 rot = mat2(cos(0.35), sin(0.35), -sin(0.35), cos(0.35));
    for (int i = 0; i < 4; ++i) {
      v += a * noise(p * 1.3);
      p = rot * p * 1.85 + shift;
      a *= 0.55;
    }
    return v;
  }

  void main() {
    vec2 uv = vUv;

    vec2 centerUv = uv * 2.0 - 1.0;
    float baseDist = max(abs(centerUv.x), abs(centerUv.y));

    float tBreath = uTime * 0.07;
    vec2 noiseUv = uv * uNoiseScale + vec2(tBreath * 0.4, tBreath * -0.32);
    float n = fbm(noiseUv);
    float n2 = fbmSlow(noiseUv * 0.65 + vec2(5.2, 1.1));

    float distortedDist = baseDist + (n * 0.52 - 0.26) * uDistortStrength;
    distortedDist += (n2 * 0.22 - 0.11) * uDistortStrength;

    float threshold = uProgress * 2.0 - 0.5;
    float mask = smoothstep(threshold - uEdgeSoftness, threshold + uEdgeSoftness, distortedDist);

    vec3 shadowColor = vec3(0.045, 0.045, 0.055);
    float grain = (hash(uv * uResolution.xy * 0.003 + uTime) - 0.5) * uGrainStrength;
    vec3 ink = shadowColor + grain;

    float alpha = 1.0 - mask;

    gl_FragColor = vec4(ink, alpha);
  }
`;
