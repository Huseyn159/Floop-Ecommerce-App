import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: ["class"],
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                bg: {
                    primary: "#0a0a0a",
                    secondary: "#111111",
                    card: "#161616",
                    elevated: "#1c1c1c",
                },
                accent: {
                    DEFAULT: "#f59e0b",
                    warm: "#fb923c",
                },
                border: {
                    DEFAULT: "#27272a",
                    accent: "rgba(245, 158, 11, 0.3)",
                },
            },
            fontFamily: {
                display: ["Bebas Neue", "cursive"],
                sans: ["DM Sans", "sans-serif"],
                mono: ["DM Mono", "monospace"],
            },
            animation: {
                "fade-in-up": "fadeInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards",
                marquee: "marquee 20s linear infinite",
                shimmer: "shimmer 2s infinite",
            },
        },
    },
    plugins: [require("tailwindcss-animate")],
};

export default config;