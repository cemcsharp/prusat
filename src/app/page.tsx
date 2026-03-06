'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getDashboardStats, getManagerReportData, getAnalyticsData, getRecentActivities } from '@/lib/actions'
import { AnalyticsCharts } from '@/components/AnalyticsCharts'
import { useNotification } from '@/context/NotificationContext'
import { pdf } from '@react-pdf/renderer'
import { ReportDocument } from '@/components/ReportDocument'
import { AnalyticsReportDocument } from '@/components/AnalyticsReportDocument'

export default function Dashboard() {
    const router = useRouter()
    const { showAlert } = useNotification()
    const [stats, setStats] = useState({
        talepHacmi: 0,
        aktifSiparis: 0,
        toplamBorc: {} as Record<string, number>,
        kritikSozlesme: 0
    })
    const [recentActivities, setRecentActivities] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [exporting, setExporting] = useState(false)

    const fetchStats = useCallback(async (isRefresh = false) => {
        if (isRefresh) setLoading(true)
        try {
            const [statsData, activitiesData] = await Promise.all([
                getDashboardStats(),
                getRecentActivities()
            ])
            setStats(statsData)
            setRecentActivities(activitiesData)
            if (isRefresh) showAlert('Veriler başarıyla güncellendi', 'success')
        } catch (err) {
            console.error('Stats loading failed:', err)
            if (isRefresh) showAlert('Veriler yenilenirken bir hata oluştu', 'error')
        } finally {
            setLoading(false)
        }
    }, [showAlert])

    useEffect(() => {
        fetchStats()
    }, [fetchStats])

    const handleExport = async (type: string) => {
        setExporting(true)
        showAlert(`${type} hazırlama süreci başlatıldı. Birazdan indirme başlayacaktır.`, 'info')

        try {
            if (type === 'Yönetici Özeti Raporu') {
                const data = await getManagerReportData()
                const blob = await pdf(<ReportDocument data={data} />).toBlob()
                const url = URL.createObjectURL(blob)
                const link = document.createElement('a')
                link.href = url
                link.download = `Yonetici_Ozeti_Raporu_${new Date().toISOString().split('T')[0]}.pdf`
                link.click()
                URL.revokeObjectURL(url)
                showAlert('Rapor başarıyla oluşturuldu ve indirildi', 'success')
            } else if (type === 'Veri Analitiği') {
                const data = await getAnalyticsData()
                const blob = await pdf(<AnalyticsReportDocument data={data} />).toBlob()
                const url = URL.createObjectURL(blob)
                const link = document.createElement('a')
                link.href = url
                link.download = `Analitik_Performans_Raporu_${new Date().toISOString().split('T')[0]}.pdf`
                link.click()
                URL.revokeObjectURL(url)
                showAlert('Analitik raporu başarıyla oluşturuldu ve indirildi', 'success')
            } else {
                // Diğer rapor tipleri için (Analitik vb.) henüz PDF şablonu yoksa placeholder
                showAlert('Bu rapor tipi için PDF şablonu henüz hazır değil', 'warning')
            }
        } catch (err) {
            console.error('Export failed:', err)
            showAlert('Rapor oluşturulurken bir hata oluştu', 'error')
        } finally {
            setExporting(false)
        }
    }

    return (
        <div className="flex flex-col gap-8 animate-in">
            {/* Page Header */}
            <div className="flex justify-between items-end border-b border-slate-200 pb-5">
                <div>
                    <h2 className="text-[15px] font-medium text-slate-800 uppercase tracking-widest">Kurumsal Performans Özeti</h2>
                    <p className="text-[9px] text-slate-500 font-medium mt-0.5 uppercase tracking-tighter">Gerçek Zamanlı Satınalma Metrikleri</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => fetchStats(true)}
                        disabled={loading}
                        className="bg-slate-50 text-slate-600 px-3 py-1.5 rounded text-[10px] font-medium border border-slate-200 hover:bg-slate-100 uppercase tracking-widest transition-all disabled:opacity-50"
                    >
                        {loading ? 'Yenileniyor...' : 'Verileri Yenile'}
                    </button>
                    <button
                        onClick={() => handleExport('Yönetici Özeti Raporu')}
                        disabled={exporting}
                        className="bg-slate-700 text-white px-3 py-1.5 rounded text-[10px] font-medium border border-slate-600 hover:bg-slate-800 uppercase tracking-widest transition-all disabled:opacity-50"
                    >
                        {exporting ? 'Hazırlanıyor...' : 'Rapor Dışa Aktar'}
                    </button>
                </div>
            </div>

            {/* Premium Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-xl transition-all group overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform"></div>
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl shadow-lg shadow-blue-200">
                            📝
                        </div>
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-lg border border-emerald-100">
                            <span>↑</span> 12.5%
                        </div>
                    </div>
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Genel Talep Hacmi</p>
                    <h3 className="text-2xl font-black text-slate-800 mt-1">
                        {loading ? '...' : stats.talepHacmi} <span className="text-xs font-medium text-slate-400">Kayıt</span>
                    </h3>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-xl transition-all group overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/5 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform"></div>
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white text-xl shadow-lg shadow-sky-200">
                            📦
                        </div>
                        <span className="px-2 py-1 bg-sky-50 text-sky-600 text-[10px] font-bold rounded-lg border border-sky-100 uppercase">Aktif</span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Aktif Satınalma</p>
                    <h3 className="text-2xl font-black text-slate-800 mt-1">
                        {loading ? '...' : stats.aktifSiparis} <span className="text-xs font-medium text-slate-400">Operasyon</span>
                    </h3>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-xl transition-all group overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-fuchsia-500/5 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform"></div>
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-fuchsia-500 to-purple-600 flex items-center justify-center text-white text-xl shadow-lg shadow-purple-200">
                            💰
                        </div>
                        <span className={`px-2 py-1 text-[10px] font-bold rounded-lg border uppercase ${Object.keys(stats.toplamBorc).length > 0 ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                            {Object.keys(stats.toplamBorc).length > 0 ? 'Kritik' : 'Temiz'}
                        </span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Toplam Yükümlülük</p>
                    <div className="flex flex-col gap-1 mt-1">
                        {loading ? (
                            <h3 className="text-2xl font-black text-slate-800">...</h3>
                        ) : Object.keys(stats.toplamBorc).length > 0 ? (
                            Object.entries(stats.toplamBorc).map(([currency, amount]) => (
                                <h3 key={currency} className="text-2xl font-black text-slate-800 flex items-baseline gap-1.5">
                                    {new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(amount)}
                                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{currency === 'TRY' ? '₺' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency}</span>
                                </h3>
                            ))
                        ) : (
                            <h3 className="text-2xl font-black text-slate-800">0 <span className="text-xs font-medium text-slate-400">₺</span></h3>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-xl transition-all group overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform"></div>
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-xl shadow-lg shadow-amber-200">
                            📜
                        </div>
                        <span className="px-2 py-1 bg-amber-50 text-amber-600 text-[10px] font-bold rounded-lg border border-amber-100 uppercase">Takipte</span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Aktif Sözleşmeler</p>
                    <h3 className="text-2xl font-black text-slate-800 mt-1">
                        {loading ? '...' : stats.kritikSozlesme} <span className="text-xs font-medium text-slate-400">Sözleşme</span>
                    </h3>
                </div>
            </div>

            {/* Charts Section */}
            <AnalyticsCharts />

            {/* Activity and Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 premium-card overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Son Aktivite Kayıtları</h3>
                        </div>
                        <button
                            onClick={() => router.push('/talepler')}
                            className="text-[10px] text-blue-600 font-bold hover:text-blue-700 uppercase tracking-wider transition-colors"
                        >
                            Tümünü Gör →

                        </button>
                    </div>
                    <table className="w-full text-left">
                        <thead className="text-[10px] text-slate-400 uppercase tracking-widest font-bold bg-slate-50/30">
                            <tr>
                                <th className="px-6 py-4">Konu / Talep</th>
                                <th className="px-6 py-4">Barkod No</th>
                                <th className="px-6 py-4">Durum</th>
                                <th className="px-6 py-4 text-right">Tarih</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {recentActivities.map((item, i) => {
                                let badgeType = 'emerald'
                                if (item.durum === 'TASLAK' || item.durum === 'REVIZE') badgeType = 'slate'
                                if (item.durum === 'ONAY_BEKLIYOR' || item.durum === 'BIRIM_ONAYI') badgeType = 'amber'
                                if (item.durum === 'SIPARIS_BEKLIYOR') badgeType = 'sky'

                                return (
                                    <tr key={item.id} className="hover:bg-slate-50 transition-colors text-[11px] font-medium text-slate-600">
                                        <td className="px-6 py-4 uppercase tracking-tighter max-w-[250px] truncate">{item.konu}</td>
                                        <td className="px-6 py-4 font-mono text-[9px] text-slate-500">{item.barkod}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-0.5 rounded-full text-[8px] bg-${badgeType}-50 border border-${badgeType}-100 text-${badgeType}-600`}>
                                                {item.durum}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right text-slate-500 text-[10px]">
                                            {new Date(item.updatedAt).toLocaleDateString('tr-TR')}
                                        </td>
                                    </tr>
                                )
                            })}
                            {recentActivities.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400 text-[10px] uppercase font-medium">
                                        Henüz aktivite bulunmuyor.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex flex-col gap-6">
                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-xl shadow-slate-200 group relative overflow-hidden">
                        <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-white/5 rounded-full group-hover:scale-110 transition-transform"></div>
                        <h3 className="text-sm font-bold uppercase tracking-wider mb-5 flex items-center gap-2">
                            <span className="w-2 h-2 bg-blue-400 rounded-full"></span> Temel İşlemler
                        </h3>
                        <div className="flex flex-col gap-3 relative z-10">
                            <button
                                onClick={() => router.push('/talepler/yeni')}
                                className="w-full py-3 bg-blue-600 text-white rounded-xl text-[11px] font-bold hover:bg-blue-500 transition-all flex items-center justify-center uppercase tracking-widest shadow-lg shadow-blue-900/20"
                            >
                                ✨ Yeni Talep Girişi

                            </button>
                            <button
                                onClick={() => handleExport('Veri Analitiği')}
                                disabled={exporting}
                                className="w-full py-3 bg-white/10 text-slate-300 border border-white/10 rounded-xl text-[11px] font-bold hover:bg-white/20 hover:text-white transition-all flex items-center justify-center uppercase tracking-widest disabled:opacity-50"
                            >
                                {exporting ? 'Hazırlanıyor...' : '📊 Analitikleri Aktar'}

                            </button>
                        </div>
                    </div>

                    <div className="premium-card p-5 border-slate-100">
                        <h3 className="text-[10px] font-medium text-slate-500 uppercase tracking-widest mb-4">Altyapı Durumu</h3>
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded group hover:border-slate-300 transition-all cursor-default">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full shadow shadow-emerald-200"></div>
                                    <span className="text-[10px] font-medium text-slate-600 uppercase tracking-tight">Ana Sunucu DB</span>
                                </div>
                                <span className="text-[9px] font-medium text-emerald-600 uppercase">Aktif</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded group hover:border-slate-300 transition-all cursor-default">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-sky-500 rounded-full shadow shadow-sky-200"></div>
                                    <span className="text-[10px] font-medium text-slate-600 uppercase tracking-tight">Finansal API</span>
                                </div>
                                <span className="text-[9px] font-medium text-sky-600 uppercase">Senkronize</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
