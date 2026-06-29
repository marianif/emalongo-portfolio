import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.1.94"],
  images: {
    // Next 16 blocks local image optimization unless the path is allow-listed.
    // The artwork tree, plus the artist's portrait at the public root.
    localPatterns: [
      // Committed chrome only: menu cover faces + the artist portrait. The
      // catalogue works are delivered from Cloudinary (remotePatterns below).
      { pathname: "/menu/**", search: "" },
      { pathname: "/artist-photo.jpg", search: "" },
    ],
    // Cloudinary delivery host. Artwork pixels are served from the CDN; the
    // collection metadata is fetched via the /api/artworks routes.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
