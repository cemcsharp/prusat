'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { signOut } from 'next-auth/react'

const menuItems = [
    { href: '/portal/tedarikci', icon: '🏠', label: 'Dashboard' },
    { href: '/portal/tedarikci/bildirimler', icon: '🔔', label: 'Bildirimler', badge: true },
    { href: '/portal/tedarikci/rfq', icon: '📋', label: 'RFQ\'lar' },
    { href: '/portal/tedarikci/teklifler', icon: '💰', label: 'Tekliflerim' },
    { href: '/portal/tedarikci/siparisler', icon: '📦', label: 'Siparişler' },
    { href: '/portal/tedarikci/faturalar', icon: '🧾', label: 'Faturalar' },
    { href: '/portal/tedarikci/kullanicilar', icon: '👥', label: 'Ekip Yönetimi' },
    { href: '/portal/tedarikci/profil', icon: '⚙️', label: 'Firma Bilgileri' },
]

export default function TedarikciPortalLayout({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [unreadCount, setUnreadCount] = useState(0)

    useEffect(() => {
        // Okunmamış bildirim sayısını getir
        const fetchUnread = async () => {
            try {
                const res = await fetch('/api/notifications/unread-count')
                const data = await res.json()
                setUnreadCount(data.count || 0)
            } catch (err) {
                console.error('Bildirim sayısı çekilemedi:', err)
            }
        }

        fetchUnread()
        const interval = setInterval(fetchUnread, 30000) // 30 saniyede bir kontrol
        return () => clearInterval(interval)
    }, [])

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login')
        }
        // Tedarikçi rolü kontrolü
        if (status === 'authenticated' && session?.user?.role !== 'TEDARIKCI') {
            router.push('/')
        }
    }, [status, session, router])

    if (status === 'loading') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 flex items-center justify-center">
                <div className="text-white text-lg font-medium">Yükleniyor...</div>
            </div>
        )
    }

    if (status !== 'authenticated' || session?.user?.role !== 'TEDARIKCI') {
        return null
    }

    return (
        <div className="min-h-screen bg-slate-100 flex">
            {/* Sidebar */}
            <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-gradient-to-b from-slate-800 to-slate-900 transition-all duration-300 flex flex-col relative`}>
                {/* Logo */}
                <div className="p-4 border-b border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-black text-lg">P</span>
                        </div>
                        {sidebarOpen && (
                            <div>
                                <h1 className="text-sm font-bold text-white">Tedarikçi Portalı</h1>
                                <p className="text-[9px] text-teal-300 uppercase tracking-widest">PRU SatınalmaPRO</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Menu */}
                <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                    {menuItems.map(item => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="flex items-center justify-between group px-3 py-2.5 rounded-lg text-slate-300 hover:bg-teal-500/20 hover:text-teal-300 transition-all"
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-lg opacity-70 group-hover:opacity-100">{item.icon}</span>
                                {sidebarOpen && (
                                    <span className="text-[11px] font-medium uppercase tracking-wider">{item.label}</span>
                                )}
                            </div>
                            {item.badge && unreadCount > 0 && (
                                <span className={`flex items-center justify-center bg-rose-500 text-white text-[9px] font-black rounded-full ${sidebarOpen ? 'px-1.5 py-0.5 min-w-[18px]' : 'w-2 h-2 absolute top-2 right-2'}`}>
                                    {sidebarOpen ? unreadCount : ''}
                                </span>
                            )}
                        </Link>
                    ))}
                </nav>

                {/* Footer */}
                <div className="p-3 border-t border-slate-700">
                    {sidebarOpen && session?.user && (
                        <div className="mb-3 px-3">
                            <p className="text-[10px] text-slate-400 truncate">{session.user.email}</p>
                            <p className="text-[9px] text-teal-400 uppercase">Tedarikçi</p>
                        </div>
                    )}
                    <button
                        onClick={() => signOut({ callbackUrl: '/login' })}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:bg-rose-500/20 hover:text-rose-300 transition-all"
                    >
                        <span className="text-lg">🚪</span>
                        {sidebarOpen && <span className="text-[11px] font-medium uppercase tracking-wider">Çıkış</span>}
                    </button>
                </div>

                {/* Toggle Button */}
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="absolute top-4 -right-3 w-6 h-6 bg-slate-700 border border-slate-600 rounded-full flex items-center justify-center text-white hover:bg-teal-500 transition-all z-10"
                >
                    {sidebarOpen ? '◀' : '▶'}
                </button>
            </aside>

            {/* Main Content */}
            <main className="flex-1 h-screen overflow-auto bg-slate-50">
                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    )
}
