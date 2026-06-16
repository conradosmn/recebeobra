import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // As fotos comprimidas chegam como dataURL no corpo da server action.
  experimental: {
    serverActions: { bodySizeLimit: "10mb" },
  },
};

export default nextConfig;
