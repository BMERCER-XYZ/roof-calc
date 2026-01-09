import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  // This is required for GitHub Pages if the repo name is not the same as the user/org name
  // basePath: '/repo-name', 
};

export default nextConfig;