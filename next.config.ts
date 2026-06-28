import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.1.94"],
  images: {
    // Next 16 blocks local image optimization unless the path is allow-listed.
    // The artwork tree, plus the artist's portrait at the public root.
    localPatterns: [
      { pathname: "/artworks/**", search: "" },
      { pathname: "/artist-photo.jpg", search: "" },
    ],
  },
};

export default nextConfig;
