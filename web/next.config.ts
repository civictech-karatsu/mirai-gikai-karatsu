import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// civictech-karatsu.org/mirai-gikai の下で配信する（ルーター Worker がパスをそのまま転送する）
const basePath = "/mirai-gikai";

const nextConfig: NextConfig = {
  basePath,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  async redirects() {
    return [
      {
        source: "/",
        destination: basePath,
        basePath: false,
        permanent: false,
      },
    ];
  },
  experimental: {
    serverSourceMaps: true,
    serverActions: {
      // ルーター Worker 経由だと Origin（civictech-karatsu.org）と Host（vercel.app）が
      // 一致せず Server Action が拒否されるため、公開ドメインを許可する
      allowedOrigins: ["civictech-karatsu.org"],
    },
  },
  typedRoutes: true,
  turbopack: {
    root: "../",
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "127.0.0.1",
        pathname: "/storage/v1/object/public/bill-thumbnails/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        pathname: "/storage/v1/object/public/bill-thumbnails/**",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/bill-thumbnails/**",
      },
      ...(isDev
        ? [
            {
              protocol: "https" as const,
              hostname: "placehold.co",
            },
          ]
        : []),
    ],
    ...(isDev && {
      dangerouslyAllowSVG: true,
      contentDispositionType: "attachment" as const,
      contentSecurityPolicy:
        "default-src 'self'; script-src 'none'; sandbox;",
    }),
  },
};

export default nextConfig;
