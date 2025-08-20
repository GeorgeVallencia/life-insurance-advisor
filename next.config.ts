import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  
   eslint: {
    // ⚠️ Warning: This allows production builds even if there are lint errors
    ignoreDuringBuilds: true,
  },
  typescript: {
    // ⚠️ Same for TS errors
    ignoreBuildErrors: true,
  },
};


export default nextConfig;


