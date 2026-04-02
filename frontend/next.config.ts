import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Avoid picking a parent folder lockfile (e.g. C:\Users\<user>\package-lock.json) as the monorepo root
  turbopack: {
    root: path.join(__dirname),
  },
  async rewrites() {
    // Proxy browser -> backend through Next.js to avoid any CORS/network issues.
    // NEXT_PUBLIC_API_URL is expected to be something like: http://localhost:5000/api
    const envApi = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
    const backendOrigin = envApi.replace(/\/api\/?$/i, "");

    return [
      {
        source: "/backend/:path*",
        destination: `${backendOrigin}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
