'use client'

import { useState, useEffect } from 'react'
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification, deleteAllNotifications } from '@/lib/actions'
import { useNotification } from '@/context/NotificationContext'
import Link from 'next/link'

export default function BildirimlerPage() {
    const [notifications, setNotifications] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const { showAlert, showConfirm } = useNotification()

    useEffect(() => {
        fetchData()
    }, [])

    async function fetchData() {
        setLoading(true)
        try {
            const data = await getNotifications()
            setNotifications(data)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    async function handleRead(id: number) {
        await markNotificationAsRead(id)
        fetchData()
    }

    async function handleAllRead() {
        const confirmed = await showConfirm('Tüm bildirimleri okundu olarak işaretlemek istediğinize emin misiniz?')
        if (!confirmed) return

        await markAllNotificationsAsRead()
        fetchData()
        showAlert('Tüm bildirimler okundu olarak işaretlendi', 'success')
    }

    async function handleDelete(id: number) {
        const confirmed = await showConfirm('Bu bildirimi silmek istediğinize emin misiniz?')
        if (!confirmed) return

        const res = await deleteNotification(id)
        if (res) {
            showAlert('Bildirim silindi', 'success')
            fetchData()
        }
    }

    async function handleDeleteAll() {
        const confirmed = await showConfirm('Tüm bildirimleri tamamen silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')
        if (!confirmed) return

        const res = await deleteAllNotifications()
        if (res) {
            showAlert('Tüm bildirimler silindi', 'success')
            fetchData()
        }
    }

    const formatTime = (date: Date) => {
        return new Date(date).toLocaleString('tr-TR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const getIcon = (type: string) => {
        switch (type) {
            case 'alert': return <span className="text-rose-500">🚨</span>
            case 'warning': return <span className="text-amber-500">⚠️</span>
            case 'info': return <span className="text-sky-500">ℹ️</span>
            case 'success': return <span className="text-emerald-500">✅</span>
            default: return <span className="text-slate-400">🔔</span>
        }
    }

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-500 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-slate-200 pb-6">
                <div>
                    <h2 className="text-[18px] font-bold text-slate-800 uppercase tracking-widest flex items-center gap-3">
                        <span className="p-2 bg-slate-100 rounded-lg">🔔</span>
                        Bildirim Merkezi
                    </h2>
                    <p className="text-[10px] text-slate-500 font-bold mt-2 uppercase tracking-tighter opacity-70">
                        Sistem aktiviteleri, onay bekleyen talepler ve kritik güncellemeler.
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={fetchData}
                        className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 hover:bg-slate-50 transition-all uppercase tracking-widest flex items-center gap-2"
                    >
                        🔄 Yenile
                    </button>
                    {notifications.length > 0 && (
                        <>
                            <button
                                onClick={handleAllRead}
                                className="px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-lg text-[10px] font-bold hover:bg-indigo-100 transition-all uppercase tracking-widest"
                            >
                                Tümünü Oku
                            </button>
                            <button
                                onClick={handleDeleteAll}
                                className="px-4 py-2 bg-rose-50 text-rose-700 border border-rose-100 rounded-lg text-[10px] font-bold hover:bg-rose-100 transition-all uppercase tracking-widest"
                            >
                                Tümünü Temizle
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Toplam</p>
                    <p className="text-xl font-bold text-slate-800 mt-1">{notifications.length}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Okunmadı</p>
                    <p className="text-xl font-bold text-indigo-600 mt-1">{notifications.filter(n => !n.isRead).length}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Okundu</p>
                    <p className="text-xl font-bold text-slate-500 mt-1">{notifications.filter(n => n.isRead).length}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Kritik</p>
                    <p className="text-xl font-bold text-rose-600 mt-1">{notifications.filter(n => n.type === 'alert' || n.type === 'warning').length}</p>
                </div>
            </div>

            {/* List */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-24 flex flex-col items-center gap-4">
                        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-center text-slate-400 uppercase tracking-widest text-[11px] font-bold">Bildirimler Yükleniyor...</p>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="p-24 flex flex-col items-center gap-4 opacity-50">
                        <div className="text-4xl">📭</div>
                        <p className="text-center text-slate-400 uppercase tracking-widest text-[11px] font-bold italic">Henüz bir bildirim bulunmuyor.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {notifications.map((n) => (
                            <div
                                key={n.id}
                                className={`p-6 flex items-start gap-5 transition-all group relative ${!n.isRead ? 'bg-indigo-50/10' : 'hover:bg-slate-50/50'}`}
                            >
                                <div className="text-2xl mt-1 shrink-0 p-2 bg-white rounded-lg border border-slate-100 shadow-sm group-hover:scale-110 transition-transform">
                                    {getIcon(n.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="min-w-0 pr-4">
                                            <h3 className={`text-[14px] uppercase tracking-tight truncate ${!n.isRead ? 'font-bold text-slate-900' : 'font-medium text-slate-500'}`}>
                                                {n.title}
                                            </h3>
                                            <p className={`mt-1 text-[13px] leading-relaxed break-words ${!n.isRead ? 'text-slate-700' : 'text-slate-500 opacity-80'}`}>
                                                {n.message}
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-end shrink-0 gap-3">
                                            <span className="text-[10px] font-bold text-slate-300 uppercase whitespace-nowrap bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                                                {formatTime(n.createdAt)}
                                            </span>

                                            <div className="flex items-center gap-2 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                                                {!n.isRead && (
                                                    <button
                                                        onClick={() => handleRead(n.id)}
                                                        className="p-1.5 text-[10px] font-bold text-indigo-600 hover:bg-indigo-50 rounded border border-indigo-100"
                                                        title="Okundu İşaretle"
                                                    >
                                                        ✔️
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDelete(n.id)}
                                                    className="p-1.5 text-[10px] font-bold text-rose-500 hover:bg-rose-50 rounded border border-rose-100"
                                                    title="Sil"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {n.link && (
                                        <div className="mt-4">
                                            <Link
                                                href={n.link}
                                                onClick={() => !n.isRead && handleRead(n.id)}
                                                className="inline-flex items-center gap-2 px-4 py-1.5 bg-slate-900 hover:bg-black text-white rounded-lg text-[10px] font-bold transition-all uppercase tracking-widest group/btn"
                                            >
                                                İlgili Sayfayı Aç
                                                <span className="group-hover/btn:translate-x-1 transition-transform">→</span>
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer Tip */}
            {notifications.length > 0 && (
                <div className="text-center pb-10">
                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest opacity-60 italic">
                        * Tüm bildirimler sistem tarafından otomatik olarak arşivlenir.
                    </p>
                </div>
            )}
        </div>
    )
}
