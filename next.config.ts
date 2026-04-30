import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: [
    "preview-chat-94817c7a-cb46-40be-921a-eefc6d60b9fa.space-z.ai",
    ".space-z.ai",
    ".chatglm.site",
  ],
};

export default nextConfig;
