"use client";

import { useMemo, useRef, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import {
  inkBleedFragmentShader,
  inkBleedVertexShader,
} from "@/shaders/inkBleedTransition";

const DPR_RANGE: [number, number] = [1, 1.5];
const FULL_TIME = 1;
const REDUCED_TIME = 0.12;

function InkBleedPlane({
  progressRef,
}: {
  progressRef: React.MutableRefObject<number>;
}) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const { viewport, size } = useThree();
  const motionTimeScale = useRef(FULL_TIME);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => {
      motionTimeScale.current = mq.matches ? REDUCED_TIME : FULL_TIME;
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uProgress: { value: 1 },
      uNoiseScale: { value: 4.1 },
      uEdgeSoftness: { value: 0.2 },
      uGrainStrength: { value: 0.09 },
      uDistortStrength: { value: 1.05 },
    }),
    []
  );

  useFrame(({ clock }) => {
    const mat = materialRef.current;
    if (!mat) return;
    mat.uniforms.uTime.value = clock.getElapsedTime() * motionTimeScale.current;
    mat.uniforms.uProgress.value = progressRef.current;
    mat.uniforms.uResolution.value.set(
      Math.max(1, size.width),
      Math.max(1, size.height)
    );
  });

  return (
    <mesh position={[0, 0, 0]}>
      <planeGeometry args={[viewport.width, viewport.height, 1, 1]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={inkBleedVertexShader}
        fragmentShader={inkBleedFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
  );
}

/**
 * Full-viewport ink-bleed mask (FBM + distance field). Drives transition
 * intensity via `progressRef`: 1 = full ink, 0 = clear. Pointer-events none.
 */
export default function InkBleedOverlay({
  progressRef,
}: {
  progressRef: React.MutableRefObject<number>;
}) {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-[60]"
      aria-hidden="true"
    >
      <Canvas
        className="h-full w-full"
        camera={{ position: [0, 0, 1], fov: 75, near: 0.1, far: 10 }}
        dpr={DPR_RANGE}
        gl={{
          alpha: true,
          antialias: false,
          depth: false,
          stencil: false,
          powerPreference: "high-performance",
        }}
        frameloop="always"
        flat
        style={{ background: "transparent" }}
      >
        <InkBleedPlane progressRef={progressRef} />
      </Canvas>
    </div>
  );
}
