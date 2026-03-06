import type { NextAuthConfig } from "next-auth";

export const authConfig = {
    pages: {
        signIn: "/login",
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnLogin = nextUrl.pathname.startsWith("/login");
            const isPublicPage = nextUrl.pathname.startsWith("/api") ||
                nextUrl.pathname.startsWith("/_next") ||
                nextUrl.pathname.includes(".");

            if (isPublicPage) return true;
            if (isOnLogin) return true;

            return isLoggedIn;
        },
    },
    providers: [],
} satisfies NextAuthConfig;
