'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Sidebar from './Sidebar'
import { NotificationCenter } from './NotificationCenter'
import { NotificationProvider } from '@/context/NotificationContext'

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const { data: session, status } = useSession()
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    // Giriş sayfası, Kayıt sayfası veya Tedarikçi portalı izole - sidebar ve header gösterme
    const isIsolatedPage =
        pathname.startsWith('/teklif') ||
        pathname.startsWith('/kayit') ||
        pathname.startsWith('/portal/tedarikci') ||
        pathname === '/login'

    if (isIsolatedPage) {
        return (
            <NotificationProvider>
                {children}
            </NotificationProvider>
        )
    }

    const user = session?.user
    const initials = user?.name
        ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
        : '??'

    return (
        <NotificationProvider>
            <div className="flex min-h-screen bg-slate-100/30">
                {/* Overlay for mobile */}
                {isMobileMenuOpen && (
                    <div
                        className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
                        onClick={() => setIsMobileMenuOpen(false)}
                    ></div>
                )}

                <Sidebar
                    isOpen={isMobileMenuOpen}
                    isCollapsed={isSidebarCollapsed}
                    onClose={() => setIsMobileMenuOpen(false)}
                />

                {/* Main Content */}
                <main className="flex-1 flex flex-col min-w-0">
                    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex justify-between items-center px-4 lg:px-8 sticky top-0 z-30 shadow-sm shadow-blue-500/5">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setIsMobileMenuOpen(true)}
                                className="lg:hidden p-2 text-slate-600 hover:bg-slate-50 rounded transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                                </svg>
                            </button>
                            <button
                                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                                className="hidden lg:flex p-2 text-slate-500 hover:bg-slate-50 rounded transition-colors"
                                title={isSidebarCollapsed ? "Menüyü Genişlet" : "Menüyü Daralt"}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 transition-transform duration-300 ${isSidebarCollapsed ? 'rotate-180' : ''}`}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                                </svg>
                            </button>
                            <div className="hidden sm:block">
                                <h1 className="text-[13px] font-medium text-slate-700 uppercase tracking-widest">Kurumsal Satınalma Yönetimi</h1>
                                <p className="text-[9px] text-slate-500 font-medium mt-0.5 uppercase tracking-tighter">Sistem Durumu: Aktif</p>
                            </div>
                        </div>

                        <div className="flex-1 max-w-md mx-4 lg:mx-8 group">
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500/40">🔍</span>
                                <input
                                    type="text"
                                    placeholder="SİSTEMDE ARA..."
                                    className="w-full bg-slate-100/50 border border-slate-200/60 rounded-xl px-9 py-2 text-[10px] font-bold uppercase tracking-widest outline-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-500/5 transition-all placeholder:text-slate-400"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            const query = (e.target as HTMLInputElement).value
                                            if (query.trim()) {
                                                window.location.href = `/arama?q=${encodeURIComponent(query)}`
                                            }
                                        }
                                    }}
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-3 lg:gap-6">
                            <NotificationCenter />

                            {mounted && status === 'authenticated' && user?.role ? (
                                <>
                                    <div className="hidden md:flex flex-col text-right">
                                        <p className="text-[11px] font-medium text-slate-700 leading-none">{user?.name || 'Kullanıcı'}</p>
                                        <p className="text-[8px] font-medium text-slate-500 mt-1 uppercase tracking-tighter">
                                            {user?.role === 'ADMIN' ? 'Yönetici Erişimi' : user?.role || 'Standart Erişim'}
                                        </p>
                                    </div>
                                    <div className="relative group">
                                        <div className="w-8 h-8 bg-slate-50 rounded border border-slate-200 flex items-center justify-center text-[11px] font-medium text-slate-600 group-hover:border-slate-300 transition-all cursor-pointer overflow-hidden">
                                            {user?.image ? (
                                                <img src={user.image} alt="Avatar" className="w-full h-full object-cover" />
                                            ) : (
                                                initials
                                            )}
                                        </div>
                                        <div className="absolute top-0 right-0 w-2 h-2 bg-emerald-500 border border-white rounded-full"></div>
                                    </div>
                                </>
                            ) : (
                                <div className="flex items-center gap-3 animate-pulse">
                                    <div className="hidden md:flex flex-col items-end gap-1">
                                        <div className="h-3 w-20 bg-slate-100 rounded"></div>
                                        <div className="h-2 w-12 bg-slate-50 rounded"></div>
                                    </div>
                                    <div className="w-8 h-8 bg-slate-100 rounded-full"></div>
                                </div>
                            )}
                        </div>
                    </header>

                    <div className="p-4 lg:p-6">
                        {children}
                    </div>
                </main>
            </div>
        </NotificationProvider>
    )
}
