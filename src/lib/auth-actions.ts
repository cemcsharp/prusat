
'use server'

import { signIn, signOut } from "@/auth"
import { AuthError } from "next-auth"

export async function doLogin(prevState: string | undefined, formData: FormData) {
    try {
        // Form data handling
        // We can also accept direct email/password string if called from client code differently
        // But standard is formData
        const email = formData.get('email')
        const password = formData.get('password')

        await signIn('credentials', {
            email,
            password,
            redirectTo: '/siparisler',
        })
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case 'CredentialsSignin':
                    return 'Invalid credentials.'
                default:
                    return 'Something went wrong.'
            }
        }
        throw error
    }
}

export async function authenticate(email: string, password: string) {
    try {
        await signIn('credentials', { email, password, redirectTo: '/siparisler' })
    } catch (err) {
        if (err instanceof AuthError) {
            console.error("Auth Error Type:", err.type);
            switch (err.type) {
                case 'CredentialsSignin':
                    return { error: 'Geçersiz kullanıcı adı veya şifre' }
                default:
                    return { error: 'Giriş hatası' }
            }
        }
        // Next.js redirect hatalarını fırlatmalı, yakalamamalı
        throw err
    }
}


// Logout action
export async function doLogout() {
    await signOut({ redirect: false })
    return { success: true }
}
