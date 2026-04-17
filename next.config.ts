import type { NextConfig } from "next";

const isWindows = process.platform === "win32";
const remotePatterns = [
  {
    protocol: "https" as const,
    hostname: "**.supabase.co",
    pathname: "/storage/v1/object/public/**",
  },
];

if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
  const hostname = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname;

  remotePatterns.push({
    protocol: "https",
    hostname,
    pathname: "/storage/v1/object/public/**",
  });
}

const nextConfig: NextConfig = {
  poweredByHeader: false,
  turbopack: {
    root: process.cwd(),
  },
  images: {
    remotePatterns,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: isWindows
    ? {
        cpus: 1,
        workerThreads: true,
        staticGenerationMaxConcurrency: 1,
      }
    : undefined,
};

export default nextConfig;
