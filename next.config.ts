import type { NextConfig } from "next";

const SECURITY_HEADERS = [
  // Bloquea que la app se cargue en un <iframe> de otro origen (anti-clickjacking).
  { key: "X-Frame-Options", value: "DENY" },
  // Bloquea MIME sniffing: el browser confía solo en Content-Type del servidor.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Mandar solo el origen como referrer al navegar a otros sitios.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Bloquea uso de cámara/mic/ubicación que no pedimos.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: SECURITY_HEADERS,
      },
    ];
  },
  images: {
    remotePatterns: [
      // Google profile images (avatares de Google OAuth)
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      // Vercel Blob storage (avatares custom)
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
      // flagcdn (banderas)
      { protocol: "https", hostname: "flagcdn.com" },
    ],
  },
};

export default nextConfig;
