"use client";

import { useRef, useMemo, useEffect, useCallback, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { vertexShader, fragmentShader } from "@/shaders/hollowKnightBackground";

// ─────────────────────────────────────────────────────────────
// Performance constants
// ─────────────────────────────────────────────────────────────
const DPR_RANGE: [number, number] = [1, 1.5];
const MOUSE_LERP = 0.04;

// ─────────────────────────────────────────────────────────────
// HollowKnightPlane — Full screen shader plane
// ─────────────────────────────────────────────────────────────
function HollowKnightPlane() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const { viewport } = useThree();

  // Mutable animation state
  const mouseTarget = useRef({ x: 0.5, y: 0.5 });
  const mouseCurrent = useRef({ x: 0.5, y: 0.5 });

  // Shader uniforms — created once, mutated per-frame
  const uniforms = useMemo(() => {
    return {
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uResolution: {
        value: new THREE.Vector2(
          typeof window !== "undefined" ? window.innerWidth : 1920,
          typeof window !== "undefined" ? window.innerHeight : 1080
        ),
      },
    };
  }, []);

  // ── DOM event handlers (passive, ref-only) ──
  const onPointerMove = useCallback((e: PointerEvent) => {
    mouseTarget.current.x = e.clientX / window.innerWidth;
    mouseTarget.current.y = 1.0 - e.clientY / window.innerHeight;
  }, []);

  const onResize = useCallback(() => {
    uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
  }, [uniforms]);

  useEffect(() => {
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    onResize();

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("resize", onResize);
    };
  }, [onPointerMove, onResize]);

  // ── Per-frame uniform updates ──
  useFrame(({ clock }) => {
    const mat = materialRef.current;
    if (!mat) return;

    mat.uniforms.uTime.value = clock.getElapsedTime();

    // Smooth mouse interpolation
    mouseCurrent.current.x +=
      (mouseTarget.current.x - mouseCurrent.current.x) * MOUSE_LERP;
    mouseCurrent.current.y +=
      (mouseTarget.current.y - mouseCurrent.current.y) * MOUSE_LERP;

    mat.uniforms.uMouse.value.set(
      mouseCurrent.current.x,
      mouseCurrent.current.y
    );
  });

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[viewport.width, viewport.height, 1, 1]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
  );
}

// ─────────────────────────────────────────────────────────────
// WebGLBackground — Public component
// ─────────────────────────────────────────────────────────────
export default function WebGLBackground() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted) return null;

  return (
    <div className="pointer-events-none fixed inset-0 -z-1" aria-hidden="true">
      <Canvas
        camera={{
          position: [0, 0, 1],
          near: 0.1,
          far: 10,
          fov: 75,
        }}
        dpr={DPR_RANGE}
        gl={{
          antialias: false,
          alpha: false,
          stencil: false,
          depth: false,
          powerPreference: "high-performance",
          failIfMajorPerformanceCaveat: false,
        }}
        frameloop="always"
        flat
        style={{ background: "#050508" }}
      >
        <HollowKnightPlane />
      </Canvas>
    </div>
  );
}
