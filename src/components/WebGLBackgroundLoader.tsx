"use client";

import dynamic from "next/dynamic";

// WebGL canvas must not be server-rendered - it requires a WebGL context.
// This client component wraps the dynamic import with ssr: false,
// which is only allowed inside Client Components.
const WebGLBackground = dynamic(
  () => import("@/components/WebGLBackground"),
  { ssr: false }
);

export default function WebGLBackgroundLoader() {
  return <WebGLBackground />;
}
