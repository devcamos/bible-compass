import type { NextConfig } from "next";

// Why script-src still allows 'unsafe-inline':
// Next.js/React inject per-page inline scripts (the RSC payload pushed to
// self.__next_f and streaming helpers) whose content differs on every page, so
// they cannot be allow-listed by hash in a static header. Nonces would work but
// force every page to render dynamically (no static/SSG pages), which costs
// speed and money. Everything else below is locked to this origin.
//
// Vercel Analytics loads from /_vercel/insights in production; only the dev
// debug script comes from va.vercel-scripts.com, so that host is dev-only.
const isDev = process.env.NODE_ENV === "development";
const devAnalytics = isDev ? " https://va.vercel-scripts.com" : "";
// React uses eval only in development (to rebuild server stack traces).
// Production builds never call it, so 'unsafe-eval' stays out of the live policy.
const devEval = isDev ? " 'unsafe-eval'" : "";

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${devEval}${devAnalytics}`,
  // Inline event-handler attributes (onclick="...") are never used; block them.
  "script-src-attr 'none'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src 'self'${devAnalytics}`,
  "worker-src 'self'",
  "manifest-src 'self'",
  "frame-src 'self'",
  "frame-ancestors 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
