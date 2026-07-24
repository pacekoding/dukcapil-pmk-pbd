import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    unoptimized: true,
    localPatterns: [
      {
        pathname: "/api/backend/**",
      },
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "dukcapilpmkpbd.site",
      },
    ],
  },
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
