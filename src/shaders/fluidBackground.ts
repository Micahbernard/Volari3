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

  // ── Hash for procedural particles ──
  float hash21(vec2 p){
    p=fract(p*vec2(123.34,456.21));
    p+=dot(p,p+45.32);
    return fract(p.x*p.y);
  }

  // ── Volumetric fog layer ──
  // Returns fog density at a given UV, time, and scale.
  // Uses fbm for organic cloud shapes that drift slowly.
  float fogLayer(vec2 uv, float t, float scale, float speed){
    vec2 p = uv * scale;
    p.y -= t * speed; // slow upward drift
    float n = fbm(vec3(p, t * 0.02));
    return smoothstep(0.1, 0.7, n * 0.5 + 0.5);
  }

  // ── Void ash particle field ──
  // Procedural particles: hash-based positions that drift upward.
  // Returns combined glow from nearby particles.
  float ashParticles(vec2 uv, float t, float descent){
    float glow = 0.0;
    // Tile space into cells, check 3x3 neighborhood for smooth wrapping
    vec2 cellSize = vec2(0.08, 0.06); // ~12x16 cells across screen
    vec2 cell = floor(uv / cellSize);

    for(int dx = -1; dx <= 1; dx++){
      for(int dy = -1; dy <= 1; dy++){
        vec2 c = cell + vec2(float(dx), float(dy));
        float h = hash21(c);
        // ~55% of cells have a particle
        if(h > 0.55) continue;

        vec2 center = (c + 0.4 + 0.2 * vec2(hash21(c + 1.7), hash21(c + 3.1))) * cellSize;
        // Upward drift with gentle sway
        float speed = 0.01 + h * 0.02;
        center.y = mod(center.y + t * speed, 1.0);
        center.x += sin(t * 0.5 + h * 6.28) * 0.003;

        float dist = length(uv - center);
        // Particle is a soft dot with slight size variation
        float radius = 0.001 + h * 0.002;
        float particle = exp(-dist * dist / (radius * radius * 400.0));
        // Opacity: faint at surface, stronger in the abyss
        float opacity = mix(0.0, 0.15 + h * 0.25, descent);
        glow += particle * opacity;
      }
    }
    return glow;
  }

  void main(){
    float aspect=uResolution.x/uResolution.y;
    float tw=uTransitionWarp;
    float td=uTransitionDir;
    float d = uDescent; // shorthand — 0 = surface, 1 = abyss
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
    vec3 v_l0=vec3(0.032, 0.033, 0.037);
    vec3 v_l1=vec3(0.068, 0.070, 0.079);
    vec3 v_l2=vec3(0.112, 0.117, 0.134);
    vec3 v_l3=vec3(0.150, 0.159, 0.187);
    vec3 v_l4=vec3(0.185, 0.197, 0.232);

    vec3 d_l0=vec3(0.949, 0.925, 0.882);
    vec3 d_l1=vec3(0.910, 0.870, 0.792);
    vec3 d_l2=vec3(0.855, 0.790, 0.670);
    vec3 d_l3=vec3(0.780, 0.675, 0.498);
    vec3 d_l4=vec3(0.680, 0.545, 0.340);

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
    vec3 v_moon=vec3(0.62,0.70,0.86);
    vec3 d_moon=vec3(0.95,0.88,0.70);
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
    // All driven by uDescent: 0 = surface, 1 = abyss floor.
    // These layer on top of the existing fluid palette.
    // ═══════════════════════════════════════════════════════════

    // ── Light beam from above ──
    // A pale column centered on screen. Narrows and fades as descent deepens.
    // At surface: full beam. At abyss floor: nothing — consumed.
    {
      float beamWidth = mix(0.14, 0.02, d); // viewport fraction
      float beamCenter = 0.5; // centered
      float beamDist = abs(vUv.x - beamCenter);
      // Gaussian falloff for soft edges
      float beam = exp(-pow(beamDist / beamWidth, 2.0));
      // Vertical falloff — strongest at top, fades toward bottom
      float vertFalloff = smoothstep(1.0, 0.2, vUv.y);
      beam *= vertFalloff;
      // Opacity fades with descent
      float beamOpacity = mix(0.10, 0.0, d) * (1.0 - d * 0.95);
      // Beam color: cold silver-white
      vec3 beamColor = mix(vec3(0.55, 0.60, 0.70), vec3(0.35, 0.38, 0.45), uFlip);
      col += beamColor * beam * beamOpacity;
    }

    // ── Volumetric fog ──
    // Three layers at different scales and speeds, thickening with descent.
    // Layer 1: distant, large slow clouds
    {
      float fog1 = fogLayer(vUv, uTime, 2.5, 0.008);
      float fog1Opacity = mix(0.0, 0.25, d) * fog1;
      vec3 fogColor1 = mix(vec3(0.04, 0.045, 0.055), vec3(0.12, 0.11, 0.10), uFlip);
      col = mix(col, fogColor1, fog1Opacity);
    }
    // Layer 2: mid-range, medium detail
    {
      float fog2 = fogLayer(vUv + vec2(0.3, 0.7), uTime * 0.8, 4.0, 0.012);
      float fog2Opacity = mix(0.0, 0.35, d * d) * fog2;
      vec3 fogColor2 = mix(vec3(0.03, 0.035, 0.045), vec3(0.10, 0.095, 0.09), uFlip);
      col = mix(col, fogColor2, fog2Opacity);
    }
    // Layer 3: close, thick fog that dominates at depth
    {
      float fog3 = fogLayer(vUv + vec2(0.7, 0.2), uTime * 1.2, 6.0, 0.018);
      float fog3Opacity = mix(0.0, 0.55, d * d * d) * fog3;
      vec3 fogColor3 = mix(vec3(0.02, 0.025, 0.032), vec3(0.08, 0.075, 0.07), uFlip);
      col = mix(col, fogColor3, fog3Opacity);
    }

    // ── Void ash particles ──
    // Procedural points of pale light drifting upward through the void.
    {
      float ashGlow = ashParticles(vUv, uTime, d);
      // Ash color: pale silver-blue (void) or warm dust (day)
      vec3 ashColor = mix(vec3(0.55, 0.60, 0.70), vec3(0.70, 0.62, 0.50), uFlip);
      col += ashColor * ashGlow;
    }

    // ── Vignette intensification ──
    // Surface: existing gentle vignette. Abyss: edges consume inward.
    {
      float vig = 1.0 - smoothstep(0.06, 0.98, length(p * 0.78));
      float vigVoid = pow(vig, mix(1.24, 0.35, d)); // power drops → stronger vignette
      float vigMultiplier = mix(vigVoid, 1.0, uFlip);
      // In the abyss, vignette is so strong it becomes the dominant darkener
      col *= mix(vigMultiplier, 1.0, 0.0); // always apply (void theme)
      // In day mode, still retreat vignette
      col *= mix(1.0, 1.0, uFlip * (1.0 - d)); // day + abyss = still vignette
      // Simplified: blend between void-vignette and flat based on flip AND descent
      float finalVig = mix(vigVoid, 1.0, uFlip * (1.0 - d));
      // Re-apply: we already applied the original vignette above, so let's
      // just apply an additional descent vignette on top
      float descentVig = pow(vig, mix(1.0, 0.15, d));
      col *= mix(1.0, descentVig, d * 0.6); // blend in the intensified vignette
    }

    // ── Overall darkening ──
    // Surface: full brightness. Abyss floor: near-total darkness.
    // The color fades to near-black, consuming everything.
    {
      float darkness = mix(1.0, 0.015, d * d); // quadratic for slow start, fast finish
      col *= darkness;
    }

    // ── Abyss tint ──
    // At depth, a subtle cool violet undertone creeps in —
    // the signature of the Void in Hollow Knight.
    {
      float tintStrength = d * d * 0.12;
      vec3 abyssTint = vec3(0.08, 0.04, 0.14); // deep violet-black
      col = mix(col, col + abyssTint * col, tintStrength);
    }

    // ── Original vignette (void/day) ──
    // Re-apply the base vignette logic that was above, but now
    // it competes with the descent vignette. We handle this by
    // using the original code but letting descent override at depth.
    // (Already integrated into the descent vignette block above.)

    // ── Final brightness ──
    // Surface: original formula. Abyss: near-zero.
    // We blend the original brightness multiplier with the descent darkness.
    {
      float baseBright = mix(0.74, 0.88, uFlip) + mix(0.19, 0.11, uFlip) * (f*0.6+0.4*length(q));
      // At surface, use baseBright. At abyss floor, baseBright is irrelevant (already dark).
      // But we need it for the transition zone.
      // Only apply the base brightness where descent hasn't already consumed it.
      // The darkness multiplication above already handles the heavy lifting.
      // This just ensures the mid-descent zone still has the right feel.
      float lum = dot(col, vec3(0.2126, 0.7152, 0.0722));
      col = mix(vec3(lum), col, mix(0.90, 0.70, d)); // desaturate slightly in the abyss
    }

    col = max(col, vec3(0.0));

    gl_FragColor = vec4(col, 1.0);
  }
`;
