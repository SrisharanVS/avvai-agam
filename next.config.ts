import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{
      protocol: "https",
      hostname: "5lrdbu3r2ny5aqf1.public.blob.vercel-storage.com",
    }],
  },
};

export default nextConfig;
