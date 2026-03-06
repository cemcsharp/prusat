'use client'

import { useState, useEffect, useRef } from 'react'
import { getNotifications, markAllNotificationsAsRead, markNotificationAsRead, deleteNotification } from '@/lib/actions'
import { useRouter } from 'next/navigation'
import { useNotification } from '@/context/NotificationContext'
import Link from 'next/link'

export function NotificationCenter() {
    const [isOpen, setIsOpen] = useState(false)
    const [notifications, setNotifications] = useState<any[]>([])
    const lastNotifIdRef = useRef<number | null>(null)
    const isFetchingRef = useRef(false)
    const { showAlert } = useNotification()
    const router = useRouter()
    const dropdownRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        fetchNotifications(true)
        const interval = setInterval(() => fetchNotifications(false), 2 * 60 * 1000) // 2 dakikada bir kontrol

        // Dışarı tıklayınca kapatma
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)

        return () => {
            clearInterval(interval)
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [])

    async function fetchNotifications(isInitial = false) {
        if (isFetchingRef.current) return
        isFetchingRef.current = true
        try {
            const data = await getNotifications()

            // Yeni bildirim kontrolü (Toast için)
            if (!isInitial && data.length > 0) {
                const latest = data[0]
                if (latest.id !== lastNotifIdRef.current && !latest.isRead) {
                    showAlert(`Yeni Bildirim: ${latest.title}`, 'info')
                }
            }

            if (data.length > 0) {
                lastNotifIdRef.current = data[0].id
            }

            setNotifications(data)
        } catch (err) {
            console.error('Bildirimler yüklenemedi:', err)
        } finally {
            isFetchingRef.current = false
        }
    }

    async function handleMarkAllAsRead() {
        await markAllNotificationsAsRead()
        fetchNotifications()
    }

    async function handleRead(id: number, href?: string) {
        await markNotificationAsRead(id)
        setIsOpen(false)
        fetchNotifications()
        if (href) router.push(href)
    }

    async function handleDelete(id: number, e: React.MouseEvent) {
        e.stopPropagation()
        const res = await deleteNotification(id)
        if (res) {
            fetchNotifications()
        }
    }

    const unreadCount = notifications.filter(n => !n.isRead).length

    const formatTime = (date: Date) => {
        const now = new Date()
        const diff = now.getTime() - new Date(date).getTime()
        const mins = Math.floor(diff / 60000)
        const hours = Math.floor(mins / 60)
        const days = Math.floor(hours / 24)

        if (mins < 1) return 'Şimdi'
        if (mins < 60) return `${mins}dk önce`
        if (hours < 24) return `${hours}sa önce`
        return `${days}g önce`
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`relative p-2.5 rounded-xl transition-all ${isOpen ? 'bg-blue-50 text-blue-600 shadow-inner' : 'text-slate-500 hover:text-blue-600 hover:bg-blue-50'}`}
                title="Bildirimler"
            >
                <div className="text-[18px]">🔔</div>
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[8px] font-black rounded-full border-2 border-white flex items-center justify-center shadow-lg shadow-rose-500/20 animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-4 w-80 md:w-[400px] bg-white border border-slate-200 rounded-[24px] shadow-2xl z-[100] animate-in fade-in slide-in-from-top-2 duration-300 overflow-hidden">
                    {/* Header */}
                    <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                        <div className="flex flex-col">
                            <span className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Bildirim Merkezi</span>
                            {unreadCount > 0 && <span className="text-[9px] text-blue-600 font-black uppercase mt-0.5">{unreadCount} YENİ BİLDİRİM</span>}
                        </div>
                        <div className="flex gap-3">
                            {unreadCount > 0 && (
                                <button
                                    onClick={handleMarkAllAsRead}
                                    className="text-[10px] text-blue-600 hover:text-blue-700 uppercase font-black tracking-tight underline decoration-blue-200 underline-offset-4"
                                >
                                    Tümünü Oku
                                </button>
                            )}
                            <button
                                onClick={() => fetchNotifications()}
                                className="text-[10px] text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                🔄
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="max-h-[400px] overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="py-12 px-8 text-center flex flex-col items-center gap-3">
                                <div className="text-3xl opacity-20">📭</div>
                                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Yeni bildirim bulunmuyor.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-50">
                                {notifications.slice(0, 8).map(n => (
                                    <div
                                        key={n.id}
                                        onClick={() => handleRead(n.id, n.link || undefined)}
                                        className={`group relative p-4 hover:bg-slate-50 transition-all cursor-pointer ${!n.isRead ? 'bg-blue-50/10' : ''}`}
                                    >
                                        <div className="flex gap-4">
                                            <div className="mt-1.5 shrink-0">
                                                {n.type === 'alert' && <div className="w-2.5 h-2.5 bg-rose-500 rounded-full shadow-lg shadow-rose-200"></div>}
                                                {n.type === 'warning' && <div className="w-2.5 h-2.5 bg-amber-500 rounded-full shadow-lg shadow-amber-200"></div>}
                                                {n.type === 'info' && <div className="w-2.5 h-2.5 bg-blue-500 rounded-full shadow-lg shadow-blue-200"></div>}
                                                {n.type === 'success' && <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-lg shadow-emerald-200"></div>}
                                            </div>
                                            <div className="flex-1 min-w-0 pr-6">
                                                <h4 className={`text-[11px] uppercase tracking-tight truncate ${!n.isRead ? 'font-black text-slate-900' : 'font-bold text-slate-400'}`}>
                                                    {n.title}
                                                </h4>
                                                <p className={`text-[10px] leading-relaxed mt-1 line-clamp-2 ${!n.isRead ? 'text-slate-600 font-medium' : 'text-slate-400 italic'}`}>
                                                    {n.message}
                                                </p>
                                                <span className="text-[9px] text-slate-400 font-black mt-3 block tracking-wider opacity-60">
                                                    {formatTime(n.createdAt)}
                                                </span>
                                            </div>

                                            <button
                                                onClick={(e) => handleDelete(n.id, e)}
                                                className="absolute right-3 top-4 opacity-0 group-hover:opacity-100 hover:text-rose-500 text-slate-300 transition-all p-1"
                                                title="Sil"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-slate-100 bg-slate-50/50 text-center">
                        <Link
                            href="/bildirimler"
                            onClick={() => setIsOpen(false)}
                            className="text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest transition-colors flex items-center justify-center gap-2 group/all"
                        >
                            Tüm Bildirimleri Görüntüle <span className="group-hover/all:translate-x-1 transition-transform">→</span>
                        </Link>
                    </div>
                </div>
            )}
        </div>
    )
}
