import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  compress: true,
  poweredByHeader: false,
  serverExternalPackages: ['@prisma/client', 'prisma', 'bcryptjs'],
  outputFileTracingIncludes: {
    '/**': ['./prisma/**'],
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};

export default nextConfig;
