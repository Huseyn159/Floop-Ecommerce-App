import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
        domains: ['images.unsplash.com', 'res.cloudinary.com'],
    },
        async rewrites() {
            return [
                {
                    source: '/api/:path*',
                    destination: 'http://localhost:8080/api/:path*',
                },
                {
                    source: '/oauth2/:path*',
                    destination: 'http://localhost:8080/oauth2/:path*',
                },
                {
                    source: '/graphql',                              // ← bunu əlavə et
                    destination: 'http://localhost:8080/graphql',
                },
            ];
        },
};

export default nextConfig;