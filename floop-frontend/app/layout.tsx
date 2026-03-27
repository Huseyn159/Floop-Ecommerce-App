import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
});

export const metadata: Metadata = {
    title: "Floop — Alış-veriş platforması",
    description: "Azərbaycanın ən böyük marketplace-i",
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="az" className={inter.variable}>
        <body>{children}</body>
        </html>
    );
}