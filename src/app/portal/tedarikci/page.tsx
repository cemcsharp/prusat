'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { getSupplierDashboardStats, getRecentSupplierRFQs } from '@/lib/portalActions'

interface DashboardStats {
    aktifRfqSayisi: number
    bekleyenTeklifler: number
    onaylananTeklifler: number
    acikSiparisler: number
    toplamSiparisTutar: number
}

interface RecentRfq {
    id: number
    rfqNo: string
    baslik: string
    sonTeklif: Date
    durum: string
}

export default function TedarikciDashboardPage() {
    const { data: session } = useSession()
    const [stats, setStats] = useState<DashboardStats>({
        aktifRfqSayisi: 0,
        bekleyenTeklifler: 0,
        onaylananTeklifler: 0,
        acikSiparisler: 0,
        toplamSiparisTutar: 0
    })
    const [recentRfqs, setRecentRfqs] = useState<RecentRfq[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchData() {
            // @ts-ignore
            const supplierId = session?.user?.tedarikciId
            if (supplierId) {
                const [statsData, rfqData] = await Promise.all([
                    getSupplierDashboardStats(supplierId),
                    getRecentSupplierRFQs(supplierId)
                ])
                setStats(statsData)
                setRecentRfqs(rfqData)
            }
            setLoading(false)
        }
        if (session?.user) {
            fetchData()
        }
    }, [session])

    const statCards = [
        { label: 'Aktif RFQ', value: stats.aktifRfqSayisi, icon: '📋', color: 'from-teal-500 to-emerald-500', suffix: '' },
        { label: 'Bekleyen Teklifler', value: stats.bekleyenTeklifler, icon: '⏳', color: 'from-amber-500 to-orange-500', suffix: '' },
        { label: 'Onaylanan Teklifler', value: stats.onaylananTeklifler, icon: '✅', color: 'from-green-500 to-emerald-600', suffix: '' },
        { label: 'Açık Siparişler', value: stats.acikSiparisler, icon: '📦', color: 'from-blue-500 to-indigo-500', suffix: '' },
    ]

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-bold text-slate-800">Hoş Geldiniz 👋</h1>
                    <p className="text-sm text-slate-500">Tedarikçi Portalı Dashboard</p>
                </div>
                <div className="text-right">
                    <p className="text-xs text-slate-400">{new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((card, idx) => (
                    <div key={idx} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-lg transition-all">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-2xl">{card.icon}</span>
                            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center`}>
                                <span className="text-white font-bold text-sm">{card.value}</span>
                            </div>
                        </div>
                        <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">{card.label}</p>
                        <p className="text-xl font-bold text-slate-800 mt-1">
                            {card.value}{card.suffix}
                        </p>
                    </div>
                ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent RFQs */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Son RFQ'lar</h3>
                        <a href="/portal/tedarikci/rfq" className="text-xs text-teal-500 hover:text-teal-600 font-medium">
                            Tümünü Gör →
                        </a>
                    </div>

                    {loading ? (
                        <div className="text-center py-8 text-slate-400">Yükleniyor...</div>
                    ) : recentRfqs.length === 0 ? (
                        <div className="text-center py-8">
                            <div className="text-3xl opacity-30 mb-2">📋</div>
                            <p className="text-sm text-slate-400">Henüz aktif RFQ bulunmuyor</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {recentRfqs.map(rfq => (
                                <div key={rfq.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-all">
                                    <div>
                                        <p className="text-xs font-bold text-teal-600">{rfq.rfqNo}</p>
                                        <p className="text-sm text-slate-700 font-medium">{rfq.baslik}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="px-2 py-1 bg-teal-100 text-teal-700 text-[10px] font-bold uppercase rounded-full">
                                            {rfq.durum}
                                        </span>
                                        <p className="text-[10px] text-slate-400 mt-1">
                                            Son: {new Date(rfq.sonTeklif).toLocaleDateString('tr-TR')}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-xl border border-slate-200 p-5">
                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">Hızlı İşlemler</h3>
                    <div className="space-y-3">
                        <a
                            href="/portal/tedarikci/rfq"
                            className="flex items-center gap-3 p-3 bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 rounded-lg hover:from-teal-100 hover:to-emerald-100 transition-all"
                        >
                            <span className="text-xl">📋</span>
                            <div>
                                <p className="text-sm font-medium text-slate-700">RFQ'ları Görüntüle</p>
                                <p className="text-[10px] text-slate-400">Açık teklif taleplerine göz atın</p>
                            </div>
                        </a>
                        <a
                            href="/portal/tedarikci/teklifler"
                            className="flex items-center gap-3 p-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg hover:from-amber-100 hover:to-orange-100 transition-all"
                        >
                            <span className="text-xl">💰</span>
                            <div>
                                <p className="text-sm font-medium text-slate-700">Tekliflerimi Gör</p>
                                <p className="text-[10px] text-slate-400">Gönderdiğiniz teklifleri takip edin</p>
                            </div>
                        </a>
                        <a
                            href="/portal/tedarikci/profil"
                            className="flex items-center gap-3 p-3 bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 rounded-lg hover:from-slate-100 hover:to-slate-200 transition-all"
                        >
                            <span className="text-xl">⚙️</span>
                            <div>
                                <p className="text-sm font-medium text-slate-700">Firma Bilgileri</p>
                                <p className="text-[10px] text-slate-400">Profil ve iletişim bilgilerini güncelleyin</p>
                            </div>
                        </a>
                    </div>
                </div>
            </div>

            {/* Info Banner */}
            <div className="bg-gradient-to-r from-teal-500 to-emerald-500 rounded-xl p-5 text-white">
                <div className="flex items-center gap-4">
                    <div className="text-3xl">💡</div>
                    <div>
                        <h4 className="font-bold">Tedarikçi Portalı</h4>
                        <p className="text-sm text-teal-100">
                            Bu portal üzerinden aktif RFQ'lara teklif verebilir, siparişlerinizi takip edebilir ve faturalarınızı yönetebilirsiniz.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
