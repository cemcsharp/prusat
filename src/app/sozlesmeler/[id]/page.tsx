'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { getSozlesme } from '@/lib/actions'
import { useNotification } from '@/context/NotificationContext'
import FileUpload from '@/components/FileUpload'
import AttachmentList from '@/components/AttachmentList'

export default function SozlesmeDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const router = useRouter()
    const { showAlert } = useNotification()
    const [sozlesme, setSozlesme] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [refreshFiles, setRefreshFiles] = useState(0)

    useEffect(() => {
        if (id) {
            fetchSozlesme()
        }
    }, [id])

    async function fetchSozlesme() {
        try {
            const data = await getSozlesme(parseInt(id))
            if (!data) {
                showAlert('Sözleşme bulunamadı', 'error')
                router.push('/sozlesmeler')
                return
            }
            setSozlesme(data)
        } catch (err) {
            console.error(err)
            showAlert('Sözleşme yüklenirken hata oluştu', 'error')
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] animate-pulse">
                    Sözleşme Arşivi Taranıyor...
                </div>
            </div>
        )
    }

    if (!sozlesme) return null

    const bitisDate = new Date(sozlesme.bitisTarihi)
    const isNear = bitisDate.getTime() - new Date().getTime() < 1000 * 60 * 60 * 24 * 30 // 30 gün

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex justify-between items-end border-b border-slate-200 pb-5">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <button
                            onClick={() => router.push('/sozlesmeler')}
                            className="text-slate-400 hover:text-slate-800 transition-colors text-lg"
                        >
                            ←
                        </button>
                        <h2 className="text-[15px] font-medium text-slate-800 uppercase tracking-widest">
                            Sözleşme Detay Dosyası
                        </h2>
                    </div>
                    <p className="text-[9px] text-slate-500 font-medium uppercase tracking-tighter italic ml-7">
                        {sozlesme.sozlesmeNo} - Hukuki Süreç Detayı
                    </p>
                </div>
                <div className="flex gap-2">
                    <span className={`px-3 py-1 rounded text-[10px] font-bold border uppercase tracking-tighter ${isNear ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                        }`}>
                        {isNear ? 'Kritik Süre' : 'Aktif / Geçerli'}
                    </span>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Contract Details */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="premium-card p-6 space-y-8">
                        {/* Timeline */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Başlangıç</label>
                                <p className="text-sm font-bold text-slate-700">
                                    {new Date(sozlesme.baslangicTarihi).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })}
                                </p>
                            </div>
                            <div className="space-y-1 border-l border-slate-100 pl-8">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Bitiş / Vade</label>
                                <p className={`text-sm font-bold ${isNear ? 'text-rose-600' : 'text-slate-700'}`}>
                                    {new Date(sozlesme.bitisTarihi).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })}
                                </p>
                            </div>
                            <div className="space-y-1 border-l border-slate-100 pl-8">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Kalan Süre</label>
                                <p className="text-sm font-bold text-slate-700">
                                    {Math.ceil((bitisDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} Gün
                                </p>
                            </div>
                        </div>

                        {/* Supplier and Order Ref */}
                        <div className="pt-8 border-t border-slate-50">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Tedarikçi Bilgisi</label>
                                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-lg border border-slate-100">🏢</div>
                                            <div>
                                                <h4 className="text-xs font-black text-slate-900 uppercase">{sozlesme.siparis?.tedarikci?.ad || 'Tedarikçi Belirtilmedi'}</h4>
                                                <p className="text-[9px] text-slate-500 font-medium uppercase tracking-tight">{sozlesme.siparis?.tedarikci?.yetkiliKisi}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 block">İlişkili Sipariş (PO)</label>
                                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => router.push(`/siparisler/${sozlesme.siparisId}`)}>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-lg border border-slate-100">📜</div>
                                            <div>
                                                <h4 className="text-xs font-black text-indigo-600 uppercase underline">{sozlesme.siparis?.barkod}</h4>
                                                <p className="text-[9px] text-slate-500 font-medium uppercase tracking-tight line-clamp-1">{sozlesme.siparis?.talep?.konu}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Digital Archive */}
                        <div className="pt-8 border-t border-slate-50">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4 block">Dijital Arşiv (Sözleşme Taramaları)</label>
                            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                                <AttachmentList relatedEntity="SOZLESME" entityId={sozlesme.id} refreshTrigger={refreshFiles} />
                                <div className="mt-6">
                                    <FileUpload
                                        relatedEntity="SOZLESME"
                                        entityId={sozlesme.id}
                                        onSuccess={() => setRefreshFiles(prev => prev + 1)}
                                        label="Sözleşme Belgesi Ekle"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Actions & Notifications */}
                <div className="space-y-6">
                    {/* Status Card */}
                    <div className="premium-card p-6 bg-slate-900 text-white">
                        <h3 className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-5">Hukuki Durum</h3>
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className={`w-3 h-3 rounded-full ${isNear ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                                <span className="text-xs font-bold uppercase tracking-widest">
                                    {isNear ? 'Yenileme Gerekli' : 'Yürürlükte'}
                                </span>
                            </div>
                            <p className="text-[10px] text-white/50 leading-relaxed italic">
                                Bu sözleşme {new Date(sozlesme.bitisTarihi).toLocaleDateString('tr-TR')} tarihine kadar geçerliliğini korumaktadır.
                            </p>
                        </div>
                    </div>

                    {/* Summary Info */}
                    <div className="premium-card p-6">
                        <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <span className="w-1.5 h-4 bg-amber-500 rounded-full"></span>
                            Sözleşme Notları
                        </h3>
                        <div className="space-y-4">
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[10px] text-slate-500 font-medium leading-relaxed italic">
                                "Sözleşme kapsamında gizlilik protokolü ve KVKK maddeleri saklı tutulmuştur."
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-slate-50">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">İmza Durumu</span>
                                <span className="text-[10px] font-black text-emerald-600 uppercase">Tamamlandı</span>
                            </div>
                        </div>
                    </div>

                    {/* Export Actions */}
                    <div className="premium-card p-6 flex flex-col gap-3">
                        <button className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-black py-3 rounded-xl text-[10px] uppercase tracking-widest transition-all">
                            Yazdır / PDF Kaydet
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
