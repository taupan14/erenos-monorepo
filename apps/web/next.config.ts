import type { NextConfig } from "next";

// Izinkan next/image memuat foto dari Supabase Storage (bucket publik 'media').
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL)
  : null;

const config: NextConfig = {
  transpilePackages: ["@erenos/shared"],
  images: {
    remotePatterns: supabaseUrl
      ? [
          {
            protocol: supabaseUrl.protocol.replace(":", "") as "http" | "https",
            hostname: supabaseUrl.hostname,
            port: supabaseUrl.port,
            pathname: "/storage/v1/object/public/**",
          },
        ]
      : [],
    // Supabase lokal berjalan di 127.0.0.1; hanya diizinkan saat development
    dangerouslyAllowLocalIP: process.env.NODE_ENV !== "production",
  },
};

export default config;
