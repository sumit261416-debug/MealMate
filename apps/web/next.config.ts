import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Admin panel is cookie-authenticated and fully dynamic.
  cacheComponents: false,
  turbopack: {
    root: path.join(__dirname, "../.."),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
