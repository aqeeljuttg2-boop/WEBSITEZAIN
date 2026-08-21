import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  serverExternalPackages: ['@prisma/client', 'prisma', 'bcryptjs'],
  outputFileTracingIncludes: {
    '/**': ['./prisma/**'],
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
