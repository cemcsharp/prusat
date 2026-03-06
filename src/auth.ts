import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { authConfig } from "./auth.config";

async function getUser(email: string) {
    try {
        const user = await prisma.user.findUnique({
            where: { email },
            include: { personel: true, tedarikci: true }
        });
        return user;
    } catch (error) {
        console.error("Failed to fetch user:", error);
        throw new Error("Failed to fetch user.");
    }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
    ...authConfig,
    providers: [
        Credentials({
            async authorize(credentials) {
                const parsedCredentials = z
                    .object({ email: z.string().email(), password: z.string().min(6) })
                    .safeParse(credentials);

                if (parsedCredentials.success) {
                    const { email, password } = parsedCredentials.data;
                    const user = await getUser(email);
                    if (!user) {
                        console.error("DEBUG: User not found in DB:", email);
                        return null;
                    }

                    const passwordsMatch = await bcrypt.compare(password, user.password || "");
                    if (passwordsMatch) {
                        return {
                            id: user.id.toString(),
                            name: user.name,
                            email: user.email,
                            role: user.role,
                            image: user.image,
                            personelId: user.personelId ?? undefined,
                            tedarikciId: user.tedarikciId ?? undefined,
                            isTedarikciAdmin: user.isTedarikciAdmin ?? false

                        };
                    } else {
                        console.error("DEBUG: Password mismatch for user:", email);
                    }
                }

                console.log("Invalid credentials");
                return null;
            },
        }),
    ],
    callbacks: {
        async authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isProtectedRoute =
                nextUrl.pathname.startsWith("/siparisler") ||
                nextUrl.pathname.startsWith("/talepler") ||
                nextUrl.pathname.startsWith("/finans") ||
                nextUrl.pathname.startsWith("/tedarikci") ||
                nextUrl.pathname.startsWith("/ayarlar") ||
                nextUrl.pathname.startsWith("/rfq") ||
                nextUrl.pathname.startsWith("/profil") ||
                nextUrl.pathname.startsWith("/portal") ||

                nextUrl.pathname === "/";

            if (isProtectedRoute && !isLoggedIn) return false;
            return true;
        },
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.id = user.id;
                token.role = (user as any).role;
                token.personelId = (user as any).personelId;
                token.tedarikciId = (user as any).tedarikciId;
                token.isTedarikciAdmin = (user as any).isTedarikciAdmin;
                token.name = user.name || user.email || "İsimsiz Kullanıcı";
                token.email = user.email;
                token.image = (user as any).image;
            }
            // Update trigger handling if name/email/image changes during session
            if (trigger === "update" && session) {
                token.name = session.name || token.name;
                token.email = session.email || token.email;
                token.image = session.image || token.image;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = (token.id || token.sub) as string;
                // @ts-ignore
                session.user.role = token.role as string;
                // @ts-ignore
                session.user.personelId = token.personelId as number;
                // @ts-ignore
                session.user.tedarikciId = token.tedarikciId as number;
                // @ts-ignore
                session.user.isTedarikciAdmin = token.isTedarikciAdmin as boolean;
                session.user.name = token.name as string || token.email as string || "İsimsiz";
                session.user.email = token.email as string;
                session.user.image = token.image as string;
            }
            return session;
        }
    },
    session: {
        strategy: "jwt"
    },
    secret: process.env.AUTH_SECRET,
});
