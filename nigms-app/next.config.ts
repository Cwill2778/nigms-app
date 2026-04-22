import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "vnlpckluzrssjcclnfgn.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      // Unsplash — for dummy data during development
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
    // Increase memory limit for large image optimization
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },
};

export default nextConfig;
