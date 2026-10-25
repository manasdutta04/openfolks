import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();
const isProd = process.env.NODE_ENV === 'production';

// Inline scripts and styles are required by Next's hydration payload and by
// the docs theme, so those two directives keep 'unsafe-inline'. Everything
// else is restricted to this origin, plus the sponsor embed on the landing
// page. Dev mode also needs eval for refresh.
const SPONSOR = 'https://sponsoranysite.com';
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' ${SPONSOR}${isProd ? '' : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: https://opengraph.githubassets.com ${SPONSOR}`,
  "font-src 'self' data:",
  `connect-src 'self' ${SPONSOR}${isProd ? '' : ' ws: wss:'}`,
  `frame-src ${SPONSOR}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  ...(isProd ? [{ key: 'Content-Security-Policy', value: csp }] : []),
];

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  poweredByHeader: false,
  allowedDevOrigins: ['127.0.0.1'],
  async redirects() {
    return [
      { source: '/changelog', destination: '/docs/changelog', permanent: true },
      { source: '/features/bots', destination: '/features/folks', permanent: true },
    ];
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default withMDX(config);
