'use client'

import { useState, useEffect } from 'react'
import { getPendingCategoryRequests, approveCategoryRequest, rejectCategoryRequest } from '@/lib/actions'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function CategoryApprovalPage() {
    const { data: session } = useSession()
    const router = useRouter()
    const [requests, setRequests] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadRequests()
    }, [])

    async function loadRequests() {
        try {
            const data = await getPendingCategoryRequests()
            setRequests(data)
        } catch (error) {
            console.error('İstekler yüklenirken hata:', error)
        } finally {
            setLoading(false)
        }
    }

    async function handleApprove(id: number) {
        if (!confirm('Bu kategori isteğini onaylamak istediğinize emin misiniz?')) return
        try {
            await approveCategoryRequest(id)
            setRequests(prev => prev.filter(r => r.id !== id))
            alert('Kategori onaylandı.')
        } catch (error) {
            alert('İşlem başarısız.')
        }
    }

    async function handleReject(id: number) {
        if (!confirm('Bu isteği reddetmek istediğinize emin misiniz?')) return
        try {
            await rejectCategoryRequest(id)
            setRequests(prev => prev.filter(r => r.id !== id))
            alert('İstek reddedildi.')
        } catch (error) {
            alert('İşlem başarısız.')
        }
    }

    if (loading) return <div className="p-8 text-center text-slate-400">Yükleniyor...</div>

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-2">Kategori Onayları</h1>
                    <p className="text-slate-400 text-sm">Tedarikçilerin kategori ekleme taleplerini yönetin.</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={loadRequests} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm transition-colors">
                        Yenile
                    </button>
                </div>
            </div>

            {requests.length === 0 ? (
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-12 text-center text-slate-400">
                    <div className="text-4xl mb-4">✅</div>
                    <p>Bekleyen onay isteği bulunmuyor.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {requests.map((req) => (
                        <div key={req.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between hover:border-slate-700 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold border border-blue-500/20">
                                    {req.tedarikci.ad.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="font-medium text-white">{req.tedarikci.ad}</h3>
                                    <p className="text-sm text-slate-400">
                                        Talep Edilen Kategori: <span className="text-indigo-400 font-medium">{req.kategori.ad}</span>
                                    </p>
                                    <p className="text-xs text-slate-500 mt-1">
                                        Talep Tarihi: {new Date(req.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleReject(req.id)}
                                    className="px-3 py-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg text-sm transition-colors"
                                >
                                    Reddet
                                </button>
                                <button
                                    onClick={() => handleApprove(req.id)}
                                    className="px-3 py-1.5 bg-green-500/10 text-green-400 hover:bg-green-500/20 rounded-lg text-sm transition-colors"
                                >
                                    Onayla
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
