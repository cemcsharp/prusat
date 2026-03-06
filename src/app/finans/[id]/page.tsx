'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { getFatura, updateFatura, deleteFatura } from '@/lib/actions'
import { useNotification } from '@/context/NotificationContext'
import FileUpload from '@/components/FileUpload'
import AttachmentList from '@/components/AttachmentList'

export default function FaturaDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const router = useRouter()
    const { showAlert, showConfirm } = useNotification()
    const [fatura, setFatura] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [refreshFiles, setRefreshFiles] = useState(0)

    useEffect(() => {
        if (id) {
            fetchFatura()
        }
    }, [id])

    async function fetchFatura() {
        try {
            const data = await getFatura(parseInt(id))
            if (!data) {
                showAlert('Fatura bulunamadı', 'error')
                router.push('/finans')
                return
            }
            setFatura(data)
        } catch (err) {
            console.error(err)
            showAlert('Fatura yüklenirken hata oluştu', 'error')
        } finally {
            setLoading(false)
        }
    }

    async function handleStatusUpdate(newStatus: string) {
        const confirmed = await showConfirm(`Fatura durumunu "${newStatus === 'ODENDI' ? 'ÖDENDİ' : 'BEKLEMEDE'}" olarak güncellemek istiyor musunuz?`)
        if (confirmed) {
            try {
                await updateFatura(fatura.id, { odemeDurumu: newStatus })
                fetchFatura()
                showAlert('Durum güncellendi', 'success')
            } catch (err) {
                showAlert('Hata: ' + (err as Error).message, 'error')
            }
        }
    }

    async function handleDelete() {
        const confirmed = await showConfirm('Bu faturayı tamamen silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')
        if (confirmed) {
            try {
                await deleteFatura(fatura.id)
                router.push('/finans')
                showAlert('Fatura silindi', 'success')
            } catch (err) {
                showAlert('Hata: ' + (err as Error).message, 'error')
            }
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] animate-pulse">
                    Finansal Veriler Analiz Ediliyor...
                </div>
            </div>
        )
    }

    if (!fatura) return null

    const getVadeDurumu = (vadeTarihi: string, odemeDurumu: string) => {
        if (odemeDurumu === 'ODENDI') return { label: 'ÖDENDİ', class: 'bg-emerald-50 text-emerald-600 border-emerald-100' }
        const vade = new Date(vadeTarihi)
        const bugun = new Date()
        bugun.setHours(0, 0, 0, 0)
        vade.setHours(0, 0, 0, 0)
        if (vade < bugun) return { label: 'GECİKMİŞ', class: 'bg-rose-50 text-rose-600 border-rose-100' }
        const fark = Math.ceil((vade.getTime() - bugun.getTime()) / (1000 * 60 * 60 * 24))
        if (fark <= 3) return { label: 'YAKLAŞAN', class: 'bg-amber-50 text-amber-600 border-amber-100' }
        return { label: 'BEKLEMEDE', class: 'bg-slate-50 text-slate-500 border-slate-100' }
    }

    const durum = getVadeDurumu(fatura.vadeTarihi, fatura.odemeDurumu)

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex justify-between items-end border-b border-slate-200 pb-5">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <button
                            onClick={() => router.push('/finans')}
                            className="text-slate-400 hover:text-slate-800 transition-colors text-lg"
                        >
                            ←
                        </button>
                        <h2 className="text-[15px] font-medium text-slate-800 uppercase tracking-widest">
                            Fatura Detay Dosyası
                        </h2>
                    </div>
                    <p className="text-[9px] text-slate-500 font-medium uppercase tracking-tighter italic ml-7">
                        {fatura.faturaNo} - Finansal Kayıt Detayı
                    </p>
                </div>
                <div className="flex gap-2">
                    <span className={`px-3 py-1 rounded text-[10px] font-bold border uppercase tracking-tighter ${durum.class}`}>
                        {durum.label}
                    </span>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Invoice Details */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="premium-card p-6 space-y-8">
                        {/* Highlights */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Fatura Tutarı</label>
                                <p className="text-2xl font-black text-slate-800 tracking-tight">
                                    ₺{Number(fatura.tutar).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                            <div className="space-y-1 border-l border-slate-100 pl-8">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Vade Tarihi</label>
                                <p className="text-sm font-bold text-slate-700">
                                    {new Date(fatura.vadeTarihi).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })}
                                </p>
                            </div>
                            <div className="space-y-1 border-l border-slate-100 pl-8">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Oluşturulma</label>
                                <p className="text-sm font-bold text-slate-700">
                                    {new Date(fatura.createdAt).toLocaleDateString('tr-TR')}
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
                                                <h4 className="text-xs font-black text-slate-900 uppercase">{fatura.siparis?.tedarikci?.ad || 'Tedarikçi Belirtilmedi'}</h4>
                                                <p className="text-[9px] text-slate-500 font-medium uppercase tracking-tight">{fatura.siparis?.tedarikci?.yetkiliKisi}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Kaynak Sipariş</label>
                                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => router.push(`/siparisler/${fatura.siparisId}`)}>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-lg border border-slate-100">📄</div>
                                            <div>
                                                <h4 className="text-xs font-black text-indigo-600 uppercase underline">{fatura.siparis?.barkod}</h4>
                                                <p className="text-[9px] text-slate-500 font-medium uppercase tracking-tight line-clamp-1">{fatura.siparis?.talep?.konu}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Attachments Section */}
                        <div className="pt-8 border-t border-slate-50">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4 block">Dijital Arşiv (E-Fatura & Belgeler)</label>
                            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                                <AttachmentList relatedEntity="FATURA" entityId={fatura.id} refreshTrigger={refreshFiles} />
                                <div className="mt-6">
                                    <FileUpload
                                        relatedEntity="FATURA"
                                        entityId={fatura.id}
                                        onSuccess={() => setRefreshFiles(prev => prev + 1)}
                                        label="Yeni Belge Yükle veya Buraya Sürükle"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Actions & Summary */}
                <div className="space-y-6">
                    {/* Action Cards */}
                    <div className="premium-card p-6 bg-slate-900 text-white">
                        <h3 className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-5">Ödeme Yönetimi</h3>
                        <div className="space-y-3">
                            {fatura.odemeDurumu === 'ODENMEDI' ? (
                                <button
                                    onClick={() => handleStatusUpdate('ODENDI')}
                                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3.5 rounded-xl text-[10px] uppercase tracking-widest transition-all shadow-lg active:scale-95"
                                >
                                    Faturayı Ödendi İşaretle
                                </button>
                            ) : (
                                <button
                                    onClick={() => handleStatusUpdate('ODENMEDI')}
                                    className="w-full bg-slate-800 hover:bg-slate-700 text-white font-black py-3.5 rounded-xl text-[10px] uppercase tracking-widest transition-all shadow-lg active:scale-95"
                                >
                                    Ödemeyi Geri Al (Bekleyen)
                                </button>
                            )}

                            <div className="pt-4 mt-4 border-t border-white/10 flex flex-col gap-2">
                                <button
                                    onClick={() => router.push(`/finans/duzenle/${fatura.id}`)}
                                    className="w-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white font-black py-3 rounded-xl text-[10px] uppercase tracking-widest transition-all border border-white/10"
                                >
                                    Fatura Verilerini Düzenle
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="w-full bg-rose-600/10 hover:bg-rose-600/20 text-rose-500 font-black py-3 rounded-xl text-[10px] uppercase tracking-widest transition-all border border-rose-500/20"
                                >
                                    Kaydı Tamamen Sil
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Summary Info */}
                    <div className="premium-card p-6">
                        <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <span className="w-1.5 h-4 bg-indigo-500 rounded-full"></span>
                            Finansal Özet
                        </h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center py-2 border-b border-slate-50">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Vergi Durumu</span>
                                <span className="text-[10px] font-black text-slate-700 uppercase">KDV Dahil</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-slate-50">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Para Birimi</span>
                                <span className="text-[10px] font-black text-slate-700 uppercase">Türk Lirası (₺)</span>
                            </div>
                            <div className="flex justify-between items-center py-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Ödeme Yolu</span>
                                <span className="text-[10px] font-black text-slate-700 uppercase">Banka Havalesi</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
