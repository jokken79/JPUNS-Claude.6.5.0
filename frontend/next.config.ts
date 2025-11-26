import type { NextConfig } from "next";
import path from "path";

const resolveApiOrigin = (): string => {
  const candidate = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

  // If it's a relative URL (like /api), return 'self' for CSP purposes
  // The proxy will handle the actual routing
  if (candidate.startsWith('/')) {
    return "'self'";
  }

  try {
    const url = new URL(candidate);
    return url.origin;
  } catch (error) {
    console.warn(`Invalid NEXT_PUBLIC_API_URL '${candidate}', falling back to http://localhost:8000`);
    return "http://localhost:8000";
  }
};

const apiOrigin = resolveApiOrigin();
const connectSrc = new Set<string>(["'self'", apiOrigin]);

if (process.env.NODE_ENV !== "production") {
  connectSrc.add("http://localhost:3000");
  connectSrc.add("http://localhost:8000");
  connectSrc.add("http://backend:8000");  // Docker internal hostname
  connectSrc.add("ws://localhost:3000");
  connectSrc.add("ws://localhost:8000");
}

const scriptSrc = process.env.NODE_ENV === 'production'
  ? "'self'"
  : "'self' 'unsafe-inline' 'unsafe-eval'";

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "object-src 'none'",
  `script-src ${scriptSrc}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data: https:",
  `connect-src ${Array.from(connectSrc).join(' ')}`,
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: contentSecurityPolicy },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
  { key: 'Origin-Agent-Cluster', value: '?1' },
  { key: 'X-Permitted-Cross-Domain-Policies', value: 'none' },
] satisfies { key: string; value: string }[];

const nextConfig: NextConfig = {
  output: 'standalone',
  outputFileTracingRoot: path.join(__dirname, '../'),

  // TypeScript errors will fail the build (security fix)
  typescript: {
    ignoreBuildErrors: false,
  },

  // Skip static generation for dynamic routes
  // This prevents prerendering errors with client-side state management
  skipTrailingSlashRedirect: true,
  skipProxyUrlNormalize: false,

  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'uns-kikaku.com',
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'cloudinary.com',
      },
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  async rewrites() {
    // In development/Docker, use the Docker service name 'backend'
    // In production outside Docker, use localhost
    const apiBackend = process.env.NODE_ENV === 'production'
      ? process.env.API_BACKEND_URL || 'http://backend:8000'
      : 'http://backend:8000';

    return [
      {
        source: '/api/:path*',
        destination: `${apiBackend}/api/:path*`,
      },
    ];
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },

  compress: true,

  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION ?? '5.6.0',
    NEXT_PUBLIC_AUTH_TOKEN_MAX_AGE: process.env.NEXT_PUBLIC_AUTH_TOKEN_MAX_AGE ?? String(60 * 60 * 8),
  },

  reactStrictMode: false,
  poweredByHeader: false,

  experimental: {
    optimizePackageImports: [
      '@radix-ui/react-icons',
      'lucide-react',
      '@heroicons/react',
      '@tanstack/react-table',
      'date-fns',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
    ],
    optimizeCss: true,
    scrollRestoration: true,
  },

  turbopack: {},

  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },

  logging: {
    fetches: {
      fullUrl: false,
    },
  },
};

export default nextConfig;
