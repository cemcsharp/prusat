'use client'

import { useState, useEffect } from 'react'
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification, deleteAllNotifications } from '@/lib/actions'
import { useNotification } from '@/context/NotificationContext'
import Link from 'next/link'

export default function SupplierBildirimlerPage() {
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
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                    <h1 className="text-xl font-bold text-slate-800 tracking-tight">Bildirim Merkezi</h1>
                    <p className="text-sm text-slate-500">RFQ davetleri, sipariş güncellemeleri ve sistem duyuruları</p>
                </div>
                <div className="flex gap-2">
                    {notifications.length > 0 && (
                        <button
                            onClick={handleAllRead}
                            className="px-4 py-2 bg-slate-100 text-slate-600 text-[10px] font-black uppercase rounded-xl hover:bg-slate-200 transition-all border border-slate-200"
                        >
                            Tümünü Oku
                        </button>
                    )}
                    <button
                        onClick={fetchData}
                        className="px-4 py-2 bg-slate-900 text-white text-[10px] font-black uppercase rounded-xl hover:bg-teal-600 transition-all shadow-lg shadow-slate-200"
                    >
                        Yenile
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-20 text-center">
                        <div className="animate-spin text-3xl mb-4 text-teal-600">⌛</div>
                        <p className="text-slate-500 font-medium">Bildirimler yükleniyor...</p>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="p-24 text-center">
                        <div className="text-6xl mb-6 opacity-20">🔔</div>
                        <h3 className="text-lg font-bold text-slate-700">Henüz bir bildiriminiz bulunmuyor</h3>
                        <p className="text-slate-400 text-sm max-w-sm mx-auto mt-2 italic font-medium">
                            Kritik güncellemeler ve davetler burada listelenecektir.
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {notifications.map((n) => (
                            <div
                                key={n.id}
                                className={`p-6 flex items-start gap-5 transition-all group ${!n.isRead ? 'bg-teal-50/20' : 'hover:bg-slate-50/50'}`}
                            >
                                <div className="text-2xl mt-1 shrink-0 p-3 bg-white rounded-2xl border border-slate-100 shadow-sm group-hover:scale-110 transition-transform">
                                    {getIcon(n.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="min-w-0 pr-4">
                                            <h3 className={`text-base tracking-tight ${!n.isRead ? 'font-black text-slate-900' : 'font-bold text-slate-500'}`}>
                                                {n.title}
                                            </h3>
                                            <p className={`mt-1 text-sm leading-relaxed ${!n.isRead ? 'text-slate-700 font-medium' : 'text-slate-500 opacity-80'}`}>
                                                {n.message}
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-end shrink-0 gap-3">
                                            <span className="text-[10px] font-black text-slate-300 uppercase whitespace-nowrap bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                                                {formatTime(n.createdAt)}
                                            </span>

                                            <div className="flex items-center gap-2">
                                                {!n.isRead && (
                                                    <button
                                                        onClick={() => handleRead(n.id)}
                                                        className="p-1.5 text-[10px] font-bold text-teal-600 hover:bg-teal-50 rounded-lg border border-teal-100"
                                                        title="Okundu İşaretle"
                                                    >
                                                        ✔️
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDelete(n.id)}
                                                    className="p-1.5 text-[10px] font-bold text-rose-500 hover:bg-rose-50 rounded-lg border border-rose-100"
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
                                                className="inline-flex items-center gap-2 px-5 py-2 bg-slate-900 hover:bg-teal-600 text-white rounded-xl text-[10px] font-black transition-all uppercase tracking-widest group/btn shadow-lg shadow-slate-200"
                                            >
                                                Detayları Görüntüle
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
        </div>
    )
}
