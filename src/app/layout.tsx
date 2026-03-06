import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import LayoutWrapper from "@/components/LayoutWrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "SatınalmaPRO | Kurumsal Takip Sistemi",
    description: "Kurumsal Satınalma ve Talep Yönetim Sistemi",
    icons: {
        icon: "/favicon.svg",
    }
};

import { SessionProvider } from "next-auth/react";

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="tr">
            <body className={`${inter.className} antialiased selection:bg-indigo-100 selection:text-indigo-900`}>
                <SessionProvider>
                    <LayoutWrapper>{children}</LayoutWrapper>
                </SessionProvider>
            </body>
        </html>
    );
}
