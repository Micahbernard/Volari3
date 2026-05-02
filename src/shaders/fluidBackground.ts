export const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uScrollProgress;
  uniform vec2  uMouse;
  uniform vec2  uResolution;
  // Ripples — vec4(originX, originY[0..1, y-up], startTime, strength[0|1]).
  // 6 slots in a ring buffer; inactive slots carry strength=0.
  uniform vec4  uRipples[6];
  uniform float uDescent;
  varying vec2  vUv;
  varying float vElevation;
  varying float vRipple;

  // ── Ripple field — concentric damped wave, stone-in-lake ──
  float rippleField(vec2 uvPos, float aspect, float time){
    float total = 0.0;
    for(int i=0; i<6; i++){
      vec4 r = uRipples[i];
      if(r.w < 0.5) continue;
      float age = time - r.z;
      if(age < 0.0 || age > 3.6) continue;
      vec2 ro = vec2((r.x - 0.5) * aspect, r.y - 0.5);
      vec2 pr = vec2((uvPos.x - 0.5) * aspect, uvPos.y - 0.5);
      float d = length(pr - ro);
      float front = age * 0.40;
      float env = exp(-pow((d - front) / 0.22, 2.0));
      float phase = d * 42.0 - age * 11.0;
      float decay = exp(-age * 0.75) * (1.0 - smoothstep(2.6, 3.6, age));
      total += cos(phase) * env * decay;
    }
    return total;
  }

  vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x,289.0);}
  vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}

  float snoise(vec3 v){
    const vec2 C=vec2(1.0/6.0,1.0/3.0);
    const vec4 D=vec4(0.0,0.5,1.0,2.0);
    vec3 i=floor(v+dot(v,C.yyy));
    vec3 x0=v-i+dot(i,C.xxx);
    vec3 g=step(x0.yzx,x0.xyz);
    vec3 l=1.0-g;
    vec3 i1=min(g.xyz,l.zxy);
    vec3 i2=max(g.xyz,l.zxy);
    vec3 x1=x0-i1+C.xxx;
    vec3 x2=x0-i2+C.yyy;
    vec3 x3=x0-D.yyy;
    i=mod(i,289.0);
    vec4 p=permute(permute(permute(
      i.z+vec4(0.0,i1.z,i2.z,1.0))
      +i.y+vec4(0.0,i1.y,i2.y,1.0))
      +i.x+vec4(0.0,i1.x,i2.x,1.0));
    float n_=1.0/7.0;
    vec3 ns=n_*D.wyz-D.xzx;
    vec4 j=p-49.0*floor(p*ns.z*ns.z);
    vec4 x_=floor(j*ns.z);
    vec4 y_=floor(j-7.0*x_);
    vec4 x=x_*ns.x+ns.yyyy;
    vec4 y=y_*ns.x+ns.yyyy;
    vec4 h=1.0-abs(x)-abs(y);
    vec4 b0=vec4(x.xy,y.xy);
    vec4 b1=vec4(x.zw,y.zw);
    vec4 s0=floor(b0)*2.0+1.0;
    vec4 s1=floor(b1)*2.0+1.0;
    vec4 sh=-step(h,vec4(0.0));
    vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
    vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
    vec3 p0=vec3(a0.xy,h.x);
    vec3 p1=vec3(a0.zw,h.y);
    vec3 p2=vec3(a1.xy,h.z);
    vec3 p3=vec3(a1.zw,h.w);
    vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
    p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
    vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);
    m=m*m;
    return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
  }

  void main(){
    vUv=uv;
    float scroll=uScrollProgress;
    float tBase=uTime*0.036;
    float tRipple=uTime*0.054;
    vec3 pos=position;

    // ── Descent dampens vertex displacement ──
    // As we sink deeper, the fluid surface calms — less noise displacement,
    // giving the impression of entering still, dead water.
    float descentDamp = mix(1.0, 0.15, uDescent);

    float n1=snoise(vec3(pos.xy*0.5,tBase+scroll*0.45))*0.16*descentDamp;
    float n2=snoise(vec3(pos.xy*1.6,tRipple*1.25+scroll*0.28))*0.05*descentDamp;
    vec2 mouse=(uMouse-0.5)*2.0;
    float mouseDist=length(pos.xy-mouse);
    float mousePush=smoothstep(1.4,0.0,mouseDist)*0.10*descentDamp;

    float aspect=uResolution.x/max(uResolution.y,1.0);
    float rip=rippleField(uv,aspect,uTime);
    vRipple=rip;

    float elevation=n1+n2+mousePush;

    // ── Edge pin ──
    float edgeDist=min(min(uv.x,1.0-uv.x),min(uv.y,1.0-uv.y));
    float edgePin=smoothstep(0.0,0.06,edgeDist);
    elevation*=edgePin;

    pos.z+=elevation;
    vElevation=elevation;
    gl_Position=projectionMatrix*modelViewMatrix*vec4(pos,1.0);
  }
`;

export const fragmentShader = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform vec2  uMouse;
  uniform float uScrollProgress;
  uniform vec2  uResolution;
  uniform vec4  uRipples[6];
  uniform float uFlip;
  uniform float uTransitionWarp;
  uniform float uTransitionDir;
  uniform vec2  uTransitionOrigin;
  // Descent into the Abyss: 0.0 = surface (hero level), 1.0 = abyss floor.
  uniform float uDescent;
  varying vec2  vUv;
  varying float vElevation;
  varying float vRipple;

  vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x,289.0);}
  vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}

  float snoise(vec3 v){
    const vec2 C=vec2(1.0/6.0,1.0/3.0);
    const vec4 D=vec4(0.0,0.5,1.0,2.0);
    vec3 i=floor(v+dot(v,C.yyy));
    vec3 x0=v-i+dot(i,C.xxx);
    vec3 g=step(x0.yzx,x0.xyz);
    vec3 l=1.0-g;
    vec3 i1=min(g.xyz,l.zxy);
    vec3 i2=max(g.xyz,l.zxy);
    vec3 x1=x0-i1+C.xxx;
    vec3 x2=x0-i2+C.yyy;
    vec3 x3=x0-D.yyy;
    i=mod(i,289.0);
    vec4 p=permute(permute(permute(
      i.z+vec4(0.0,i1.z,i2.z,1.0))
      +i.y+vec4(0.0,i1.y,i2.y,1.0))
      +i.x+vec4(0.0,i1.x,i2.x,1.0));
    float n_=1.0/7.0;
    vec3 ns=n_*D.wyz-D.xzx;
    vec4 j=p-49.0*floor(p*ns.z*ns.z);
    vec4 x_=floor(j*ns.z);
    vec4 y_=floor(j-7.0*x_);
    vec4 x=x_*ns.x+ns.yyyy;
    vec4 y=y_*ns.x+ns.yyyy;
    vec4 h=1.0-abs(x)-abs(y);
    vec4 b0=vec4(x.xy,y.xy);
    vec4 b1=vec4(x.zw,y.zw);
    vec4 s0=floor(b0)*2.0+1.0;
    vec4 s1=floor(b1)*2.0+1.0;
    vec4 sh=-step(h,vec4(0.0));
    vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
    vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
    vec3 p0=vec3(a0.xy,h.x);
    vec3 p1=vec3(a0.zw,h.y);
    vec3 p2=vec3(a1.xy,h.z);
    vec3 p3=vec3(a1.zw,h.w);
    vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
    p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
    vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);
    m=m*m;
    return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
  }

  // ── fBm: 6-octave with golden-ratio domain rotation ──
  float fbm(vec3 p){
    float val=0.0;
    float amp=0.5;
    float frq=1.0;
    mat2 rot=mat2(cos(1.618),sin(1.618),-sin(1.618),cos(1.618));
    for(int i=0;i<6;i++){
      val+=amp*snoise(p*frq);
      p.xy*=rot;
      p.yz*=rot;
      frq*=2.0;
      amp*=0.5;
    }
    return val;
  }

  // ═══════════════════════════════════════════════════════════
  // VOID DESCENT — All visual effects computed as continuous
  // noise fields. No grid partitioning. No clipping.
  //
  // Design laws:
  //   - Absolute #000000 black. No tints. No warmth. No violet.
  //   - Viscous liquid, not soft mist. Tight smoothstep = harsh,
  //     inky edges as darkness consumes the screen.
  //   - Light beam: physical shaft of light eaten by the void.
  //     Noise-distorted edges, not a soft gaussian blur.
  //   - Void bubbles: distinct floating orbs via Voronoi distance
  //     fields — continuous Euclidean distance, zero grid clipping.
  // ═══════════════════════════════════════════════════════════

  // ── Hash for Voronoi feature points ──
  // Deterministic pseudo-random from integer cell coordinates.
  // Returns 0..1
  float hashVoronoi(vec2 p){
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }
  vec2 hashVoronoi2(vec2 p){
    return vec2(hashVoronoi(p), hashVoronoi(p + vec2(71.37, 93.17)));
  }

  // Void bubbles - Voronoi distance field
  // Proper Voronoi: finds nearest feature point across a 5x5
  // neighborhood (wide enough that no bubble edge ever clips),
  // then uses smooth Euclidean distance to create circular
  // orbs. Distance field is CONTINUOUS - no hard boundaries
  // between cells because length() has no discontinuities.
  //
  // Each bubble:
  //   - Is centered at a hash-randomized position within its cell
  //   - Drifts upward over time (void ash buoyancy)
  //   - Has gentle horizontal sway
  //   - Has a soft circular glow that fades smoothly at edges
  //   - Opacity scales with descent depth
  //
  // Returns: vec3(minDist, minDist2, cellHash)
  //   minDist  = distance to nearest feature point
  //   minDist2 = distance to second-nearest (for edge glow)
  //   cellHash = hash of the nearest cell (for per-bubble variation)
  vec3 voronoiBubbles(vec2 uv, float t, float scale){
    vec2 cellSize = vec2(1.0) / scale;
    vec2 cell = floor(uv * scale);

    float minDist = 10.0;
    float minDist2 = 10.0;
    float closestHash = 0.0;

    // 3x3 neighborhood - sufficient for Voronoi since the
    // nearest feature point is always within 1 cell distance.
    // Zero clipping: distance field is continuous across cells.
    for(int dx = -1; dx <= 1; dx++){
      for(int dy = -1; dy <= 1; dy++){
        vec2 c = cell + vec2(float(dx), float(dy));

        // Random position within cell [0..1]
        vec2 randOffset = hashVoronoi2(c);

        // Feature point position in UV space
        vec2 featurePos = (c + 0.1 + 0.8 * randOffset) / scale;

        // ── Upward drift ──
        // Bubbles rise through the void like ash buoyancy.
        // Speed varies per-bubble (some fast, some slow).
        float riseSpeed = 0.008 + randOffset.x * 0.014;
        featurePos.y = mod(featurePos.y + t * riseSpeed, 1.0);

        // ── Horizontal sway ──
        // Gentle sinusoidal drift — each bubble sways differently.
        float swayAmp = 0.003 + randOffset.y * 0.006;
        featurePos.x += sin(t * 0.4 + randOffset.x * 62.83) * swayAmp;

        float dist = length(uv - featurePos);

        // Track nearest and second-nearest
        if(dist < minDist){
          minDist2 = minDist;
          minDist = dist;
          closestHash = randOffset.x;
        } else if(dist < minDist2){
          minDist2 = dist;
        }
      }
    }

    return vec3(minDist, minDist2, closestHash);
  }

  // ── Viscous void tendrils ──
  // High-frequency fBm with brutal smoothstep clamping.
  // This creates floating, organic specks and tendrils of absolute
  // black that appear to drift through the scene — like void ash
  // particulate suspended in a heavy liquid. No grid, no cells,
  // just continuous noise → impossible to clip.
  //
  // The smoothstep threshold is deliberately tight: the noise only
  // "breaks through" where it exceeds a high threshold, giving
  // sharp, inky edges rather than soft cloud shapes.
  float voidTendrils(vec2 uv, float t, float descent){
    float result = 0.0;

    // Layer 1: Large slow drift — the heavy, viscous mass
    {
      vec3 p = vec3(uv * 3.2, t * 0.012);
      p.y -= t * 0.006; // slow downward creep (sinking)
      float n = fbm(p);
      // Brutal threshold: only the peaks of the noise field break through.
      // This creates harsh, inky outlines — not soft fog.
      float tendril = smoothstep(0.25, 0.55, n);
      result += tendril * 0.45 * descent;
    }

    // Layer 2: Medium detail — drifting ash specks and thinner tendrils
    {
      vec3 p = vec3(uv * 7.0 + vec2(1.7, 3.2), t * 0.025);
      p.y -= t * 0.010;
      float n = fbm(p);
      float speck = smoothstep(0.35, 0.62, n);
      result += speck * 0.30 * descent;
    }

    // Layer 3: Fine particulate — small bright void ash motes
    // These use a HIGHER frequency and an even tighter threshold,
    // creating isolated dots and thin filaments that feel like
    // physical ash particles — but are purely continuous noise.
    {
      vec3 p = vec3(uv * 14.0 + vec2(5.1, 8.3), t * 0.04);
      p.y -= t * 0.018; // slightly faster upward drift (buoyant ash)
      float n = fbm(p);
      // Very tight threshold → sparse, isolated specks
      float mote = smoothstep(0.52, 0.72, n);
      result += mote * 0.20 * descent;
    }

    return result;
  }

  // ── Light beam from above ──
  // A physical shaft of piercing light struggling against the heavy
  // void liquid. Edges are noise-distorted — the black void actively
  // "eats" into the beam as descent deepens.
  float lightBeam(vec2 uv, float t, float descent){
    float beamCenter = 0.5;

    // Horizontal distance from center — but distorted by noise
    // so the void eats into the edges organically
    float noiseEdge = 0.0;
    {
      // Noise that distorts the beam edges over time
      // Slow drift makes the void feel alive, consuming
      vec3 np = vec3(uv * 4.0, t * 0.02);
      float edgeNoise = fbm(np);
      // Scale the distortion: more distortion as descent deepens
      // (the void gets more aggressive)
      noiseEdge = edgeNoise * mix(0.02, 0.10, descent);
    }

    float beamDist = abs(uv.x - beamCenter) + noiseEdge;

    // Beam width narrows with descent — the void crushes it
    float baseWidth = mix(0.12, 0.015, descent);

    // Harsh falloff: not a soft gaussian, but a sharp edge
    // that the void is eating into. The tight smoothstep
    // gives it a physical, almost solid quality.
    float beam = 1.0 - smoothstep(baseWidth * 0.3, baseWidth, beamDist);

    // Additional noise distortion on the beam body — makes it
    // feel like the light is struggling, flickering against the void
    vec3 bodyNoiseP = vec3(uv * 8.0, t * 0.06);
    float bodyNoise = fbm(bodyNoiseP);
    // Void eats into the beam body at depth
    float bodyEat = smoothstep(0.15, 0.55, bodyNoise) * descent * 0.6;
    beam *= (1.0 - bodyEat);

    // Vertical falloff — strongest at top, fading toward bottom
    // The light is FROM above, so it weakens as it penetrates down
    float vertFalloff = 1.0 - smoothstep(0.05, 0.85, uv.y);
    beam *= vertFalloff;

    // Overall opacity: beam fades as descent deepens
    // Quadratic fade — it resists at first, then dies quickly
    float beamOpacity = mix(0.14, 0.0, descent * descent);

    return beam * beamOpacity;
  }

  void main(){
    float aspect=uResolution.x/uResolution.y;
    float tw=uTransitionWarp;
    float td=uTransitionDir;
    float d = uDescent; // shorthand — 0 = surface, 1 = abyss floor
    vec2 uvw=vUv;
    vec2 wobble=vec2(
      snoise(vec3(vUv*6.0,uTime*0.2)),
      snoise(vec3(vUv*6.0+vec2(2.0),uTime*0.2))
    )*0.016*tw;
    vec2 uvRel=vUv-uTransitionOrigin;
    float rUV=length(uvRel)+1e-5;
    vec2 radial=uvRel/rUV;
    float ringPhase=rUV*28.0-uTime*2.4;
    vec2 radialWarp=radial*(
      sin(ringPhase)*0.012+sin(ringPhase*1.7+vUv.x*9.0)*0.006
    )*tw;
    vec2 voidPull=-radial*0.022*tw*max(-td,0.0);
    vec2 sunPush=radial*0.011*tw*max(td,0.0);
    uvw+=wobble+radialWarp+voidPull+sunPush;
    vec2 p=(uvw-0.5)*vec2(aspect,1.0);
    float scroll=uScrollProgress;

    float tSlow=uTime*0.032;
    float tRipple=uTime*0.048;

    // ── Descent slows the fluid flow ──
    // Surface = full motion. Abyss = near-stillness.
    float flowDamp = mix(1.0, 0.12, d);

    vec2 scrollDrift=vec2(scroll*0.95,-scroll*0.62) * flowDamp;
    vec2 ps=p+scrollDrift;

    float flowAngle=(uTime*0.011+scroll*0.35);
    mat2 rotFlow=mat2(cos(flowAngle),sin(flowAngle),-sin(flowAngle),cos(flowAngle));
    vec2 psr=rotFlow*ps;

    vec2 mouse=(uMouse-0.5)*vec2(aspect,1.0);
    // Mouse proximity fades in the abyss — you lose your influence down there
    float mouseProximity=(1.0-smoothstep(0.0,0.32,length(p-mouse))) * (1.0 - d * 0.7);

    float scScroll=scroll;
    vec2 q=vec2(
      fbm(vec3(psr*0.28,tSlow+scScroll*0.32)),
      fbm(vec3(psr*0.28+vec2(5.2,1.3),tSlow+scScroll*0.24))
    );
    vec2 r=vec2(
      fbm(vec3(psr*0.28+2.8*q+vec2(1.7,9.2),tSlow*0.7+scScroll*1.55)),
      fbm(vec3(psr*0.28+2.8*q+vec2(8.3,2.8),tRipple*0.88+scScroll*1.25))
    );
    float f=fbm(vec3(psr*0.28+2.0*r+vec2(mouseProximity*0.12),tRipple*0.42+scScroll*0.62));

    float burst=snoise(vec3(psr*8.0,uTime*0.55+td*0.6))
      *0.22*tw;
    f+=burst;

    // ── Theme palette ──
    // VOID: Cold abyss blues — absolute black base, deep blue-grey layers
    // Like Hollow Knight's Abyss: no warmth, only depth and cold
    vec3 v_l0=vec3(0.015, 0.015, 0.022);
    vec3 v_l1=vec3(0.025, 0.028, 0.038);
    vec3 v_l2=vec3(0.040, 0.045, 0.060);
    vec3 v_l3=vec3(0.060, 0.068, 0.090);
    vec3 v_l4=vec3(0.085, 0.095, 0.125);

    // DAY: Pale stone greys — City of Tears / Pale Court warmth
    vec3 d_l0=vec3(0.878, 0.894, 0.918);
    vec3 d_l1=vec3(0.831, 0.855, 0.886);
    vec3 d_l2=vec3(0.769, 0.792, 0.831);
    vec3 d_l3=vec3(0.667, 0.690, 0.737);
    vec3 d_l4=vec3(0.565, 0.588, 0.639);

    vec3 l0=mix(v_l0,d_l0,uFlip);
    vec3 l1=mix(v_l1,d_l1,uFlip);
    vec3 l2=mix(v_l2,d_l2,uFlip);
    vec3 l3=mix(v_l3,d_l3,uFlip);
    vec3 l4=mix(v_l4,d_l4,uFlip);

    vec3 col=l0;
    col=mix(col,l1,smoothstep(-0.45,0.55,f)*0.92);
    col=mix(col,l2,smoothstep(-0.1,0.72,f)*0.78);

    float crest=smoothstep(0.05,0.85,f)*smoothstep(0.10,0.75,length(q));
    float peak=smoothstep(0.40,0.95,f*length(r));

    float breatheCrest=0.94+0.06*sin(uTime*0.15);
    float breathePeak=0.96+0.04*sin(uTime*0.11+1.7);

    col=mix(col,l3,crest*0.55*breatheCrest);
    col=mix(col,l4,peak*0.35*breathePeak);

    col+=l2*smoothstep(0.04,0.18,vElevation)*0.30;
    col+=l3*smoothstep(0.10,0.22,vElevation)*0.15;
    float wake=mouseProximity*mouseProximity*mouseProximity;
    col+=l2*wake*0.35;
    col+=l3*wake*0.20;
    col+=l4*wake*0.08;

    // ── Ripple tint ──
    float crestRip=max(vRipple,0.0);
    float troughRip=max(-vRipple,0.0);
    vec3 v_moon=vec3(0.55,0.62,0.75);
    vec3 d_moon=vec3(0.75,0.80,0.90);
    vec3 moonTint=mix(v_moon,d_moon,uFlip);
    col+=moonTint*crestRip*0.32;
    col+=l4*crestRip*0.10;
    col-=l1*troughRip*0.14;

    float coreGlow=0.0;
    for(int i=0;i<6;i++){
      vec4 rr=uRipples[i];
      if(rr.w<0.5) continue;
      float age=uTime-rr.z;
      if(age<0.0||age>3.6) continue;
      vec2 ro=vec2((rr.x-0.5)*aspect,rr.y-0.5);
      float dist=length(p-ro);
      coreGlow+=exp(-pow(dist/0.11,2.0))*exp(-age*1.8);
    }
    col+=moonTint*coreGlow*0.16;

    // ═══════════════════════════════════════════════════════════
    // THE ABYSS — Descent effects
    //
    // All driven by uDescent: 0 = surface, 1 = abyss floor.
    // Every effect is a continuous noise field. No grids. No cells.
    // Absolute #000000 black. No tints. No warmth. No violet.
    // The Void is unforgiving.
    // ═══════════════════════════════════════════════════════════

    // ── Light beam from above ──
    // A physical shaft of pale cold light eaten by the void.
    {
      float beam = lightBeam(vUv, uTime, d);
      // Beam color: cold pale blue-grey. Like the Lighthouse in Hollow Knight.
      vec3 beamColor = vec3(0.50, 0.55, 0.65);
      col += beamColor * beam;
    }

    // ── Viscous void tendrils ──
    // Inky, harsh-edged darkness consuming the scene.
    // NOT soft fog. Tight smoothstep = sharp, viscous edges.
    {
      float voidDensity = voidTendrils(vUv, uTime, d);
      // Mix toward absolute black (#000000) based on void density
      col = mix(col, vec3(0.0), voidDensity);
    }

    // ── Vignette intensification ──
    // Surface: gentle vignette. Abyss: edges consume inward.
    // The void presses in from the edges.
    {
      float vig = 1.0 - smoothstep(0.06, 0.98, length(p * 0.78));
      float descentVig = pow(vig, mix(1.0, 0.12, d));
      // Blend in the intensified vignette — full strength at abyss floor
      col *= mix(1.0, descentVig, d * 0.7);
    }

    // ── Overall darkening ──
    // Surface: full brightness. Abyss floor: absolute #000000.
    // Quadratic curve: slow start, then the void swallows everything.
    {
      float darkness = mix(1.0, 0.0, d * d);
      col *= darkness;
    }

    // ── Desaturation toward the void ──
    // The deeper you go, the less color survives.
    // At the abyss floor: pure luminance (which is already ~0).
    {
      float lum = dot(col, vec3(0.2126, 0.7152, 0.0722));
      col = mix(col, vec3(lum), d * 0.8);
    }

    // ── Void ash particles ──
    // Fluid-integrated simplex noise. Four principles:
    //   1. The Swirl — UVs warped by hero fluid's q vector
    //   2. Anti-Gravity — noise field slides down, particles rise up
    //   3. Sparse Peak Isolation — smoothstep(0.96, 0.98), top ~2% only
    //   4. The Blend — pure white vec3(1.0) added AFTER darkening
    //
    // PLACED AFTER darkening + desaturation so they survive.
    // The ash burns through the black — immune to all crushing multiplies.
    {
      // Large ash — the visible drifting motes
      vec2 ashUv = vUv;
      ashUv += q * 0.15;              // 1. The Swirl: fluid domain warping
      ashUv.y -= uTime * 0.05;        // 2. Anti-Gravity: rises ~5% viewport/sec

      float ashRaw = snoise(vec3(ashUv * 8.0, uTime * 0.05));
      float ashN = ashRaw * 0.5 + 0.5;               // remap [-1,1] → [0,1]
      float ash = smoothstep(0.96, 0.98, ashN);       // 3. top ~2% only

      // Fine dust — lighter, faster, more numerous
      vec2 dustUv = vUv;
      dustUv += q * 0.10;             // weaker fluid coupling
      dustUv.y -= uTime * 0.08;       // faster rise — lighter particles

      float dustRaw = snoise(vec3(dustUv * 12.0, uTime * 0.08));
      float dustN = dustRaw * 0.5 + 0.5;
      float dust = smoothstep(0.94, 0.97, dustN);     // top ~3-6%

      // 4. The Blend — pure white, additive, post-darkening
      float ashGlow = ash * 0.7 + dust * 0.3;
      col += vec3(1.0) * ashGlow * 0.55 * d;
    }

    col = max(col, vec3(0.0));

    gl_FragColor = vec4(col, 1.0);
  }
`;
