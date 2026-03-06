'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { getSiparis, updateSiparisDurum } from '@/lib/actions'
import { useNotification } from '@/context/NotificationContext'
import { OrderPdfButton } from '@/components/ExportButtons'

export default function SiparisDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const router = useRouter()
    const { showAlert, showConfirm } = useNotification()
    const [siparis, setSiparis] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (id) {
            fetchSiparis()
        }
    }, [id])

    async function fetchSiparis() {
        try {
            const data = await getSiparis(parseInt(id))
            if (!data) {
                showAlert('Sipariş bulunamadı', 'error')
                router.push('/siparisler')
                return
            }
            setSiparis(data)
        } catch (err) {
            console.error(err)
            showAlert('Sipariş yüklenirken hata oluştu', 'error')
        } finally {
            setLoading(false)
        }
    }

    async function handleStatusUpdate(newStatus: string) {
        const confirmed = await showConfirm(`Sipariş durumunu "${newStatus}" olarak güncellemek istiyor musunuz?`)
        if (confirmed) {
            try {
                await updateSiparisDurum(siparis.id, newStatus)
                fetchSiparis()
                showAlert('Durum güncellendi', 'success')
            } catch (err) {
                showAlert('Hata: ' + (err as Error).message, 'error')
            }
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] animate-pulse">
                    Sipariş Verileri Hazırlanıyor...
                </div>
            </div>
        )
    }

    if (!siparis) return null

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex justify-between items-end border-b border-slate-200 pb-5">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <button
                            onClick={() => router.push('/siparisler')}
                            className="text-slate-400 hover:text-slate-800 transition-colors text-lg"
                        >
                            ←
                        </button>
                        <h2 className="text-[15px] font-medium text-slate-800 uppercase tracking-widest">
                            Sipariş Detay Dosyası
                        </h2>
                    </div>
                    <p className="text-[9px] text-slate-500 font-medium uppercase tracking-tighter italic ml-7">
                        {siparis.barkod} - Operasyonel Süreç Detayı
                    </p>
                </div>
                <div className="flex gap-2">
                    <OrderPdfButton order={siparis} />
                    <span className={`px-3 py-1 rounded text-[10px] font-bold border uppercase tracking-tighter ${siparis.durum === 'BEKLEMEDE' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                            siparis.durum === 'TAMAMLANDI' ? 'bg-sky-50 text-sky-600 border-sky-100' :
                                'bg-emerald-50 text-emerald-600 border-emerald-100'
                        }`}>
                        {siparis.durum}
                    </span>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Basic Info & Description */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="premium-card p-6 space-y-6">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Sipariş Tarihi</label>
                                <p className="text-sm font-bold text-slate-700">
                                    {new Date(siparis.tarih).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })}
                                </p>
                            </div>
                            <div className="space-y-1 border-l border-slate-100 pl-6">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Alım Yöntemi</label>
                                <p className="text-sm font-bold text-slate-700 uppercase">{siparis.alimYontemi?.ad}</p>
                            </div>
                            <div className="space-y-1 border-l border-slate-100 pl-6">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Sorumlu Birim</label>
                                <p className="text-sm font-bold text-slate-700 uppercase">{siparis.birim?.ad}</p>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-slate-50">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Tedarikçi Bilgileri</label>
                            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-xl border border-slate-100">
                                        🏢
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black text-slate-900 uppercase">{siparis.tedarikci?.ad || 'Tedarikçi Belirtilmedi'}</h4>
                                        <p className="text-[10px] text-slate-500 font-medium uppercase tracking-tight">{siparis.tedarikci?.yetkiliKisi || 'Yetkili Belirtilmedi'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-slate-50">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Sipariş Açıklaması</label>
                            <p className="text-sm text-slate-600 leading-relaxed font-medium">
                                {siparis.aciklama || 'Herhangi bir açıklama girilmemiş.'}
                            </p>
                        </div>

                        {/* Order Items (Linked Talep) */}
                        <div className="pt-6 border-t border-slate-50">
                            <div className="flex justify-between items-center mb-3">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Kalem Detayları (Ref: {siparis.talep?.barkod})</label>
                                <button
                                    onClick={() => router.push(`/talepler/${siparis.talepId}`)}
                                    className="text-[9px] font-bold text-indigo-600 uppercase hover:underline"
                                >
                                    Talebe Git →
                                </button>
                            </div>
                            <div className="border border-slate-100 rounded-2xl overflow-hidden">
                                <table className="w-full">
                                    <thead className="bg-slate-50 text-slate-500 text-[9px] uppercase tracking-widest font-bold">
                                        <tr>
                                            <th className="px-4 py-3">Madde</th>
                                            <th className="px-4 py-3 text-right">Miktar</th>
                                            <th className="px-4 py-3">Birim</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {siparis.talep?.kalemler?.map((k: any, idx: number) => (
                                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-4 py-3 text-[11px] font-bold text-slate-700 uppercase">{k.aciklama}</td>
                                                <td className="px-4 py-3 text-[11px] font-black text-slate-900 text-right">{k.miktar}</td>
                                                <td className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">{k.birim}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Payment Plan & Actions */}
                <div className="space-y-6">
                    {/* Payment Plan */}
                    <div className="premium-card p-6">
                        <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <span className="w-1.5 h-4 bg-emerald-500 rounded-full"></span>
                            Ödeme Planı
                        </h3>
                        <div className="space-y-2">
                            {siparis.odemePlani && siparis.odemePlani.length > 0 ? (
                                siparis.odemePlani.map((p: any, idx: number) => (
                                    <div key={idx} className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-black text-emerald-600">%{p.oran}</span>
                                            <div className="w-px h-6 bg-slate-200"></div>
                                            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter">
                                                {p.vadeGun === 0 ? 'Peşin' : `${p.vadeGun} Gün Vade`}
                                            </span>
                                        </div>
                                        {p.aciklama && <span className="text-[8px] text-slate-400 italic">({p.aciklama})</span>}
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">Standart Ödeme</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Related Entities Card */}
                    <div className="premium-card p-6">
                        <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest mb-4">Bağlı Kayıtlar</h3>
                        <div className="space-y-3">
                            <button
                                onClick={() => router.push(`/finans?siparisId=${siparis.id}`)}
                                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-all text-left"
                            >
                                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter">Faturalar</span>
                                <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">{siparis.faturalar?.length || 0}</span>
                            </button>
                            <button
                                onClick={() => router.push(`/sozlesmeler?siparisId=${siparis.id}`)}
                                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-all text-left"
                            >
                                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter">Sözleşmeler</span>
                                <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">{siparis.sozlesmeler?.length || 0}</span>
                            </button>
                        </div>
                    </div>

                    {/* Action Panel */}
                    <div className="premium-card p-6 bg-slate-900 text-white">
                        <h3 className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-4">Süreç Yönetimi</h3>
                        <div className="space-y-3">
                            {siparis.durum === 'BEKLEMEDE' && (
                                <button
                                    onClick={() => handleStatusUpdate('TAMAMLANDI')}
                                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3 rounded-xl text-[10px] uppercase tracking-widest transition-all shadow-lg active:scale-95"
                                >
                                    Süreci Tamamla
                                </button>
                            )}
                            <button
                                onClick={() => handleStatusUpdate('IPTAL')}
                                className="w-full bg-rose-600 hover:bg-rose-500 text-white font-black py-3 rounded-xl text-[10px] uppercase tracking-widest transition-all shadow-lg active:scale-95"
                            >
                                Siparişi İptal Et
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
