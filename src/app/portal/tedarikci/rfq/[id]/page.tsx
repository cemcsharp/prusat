'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { getRFQWithOffer, submitSupplierOffer } from '@/lib/portalActions'
import { useNotification } from '@/context/NotificationContext'
import FileUpload from '@/components/FileUpload'

export default function RFQDetailPage() {
    const { id } = useParams()
    const { data: session } = useSession()
    const router = useRouter()
    const { showAlert } = useNotification()
    const [rfq, setRfq] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [submittedTeklifId, setSubmittedTeklifId] = useState<number | null>(null)

    // Form States
    const [teslimSuresi, setTeslimSuresi] = useState(7)
    const [vadeGun, setVadeGun] = useState(30)
    const [gecerlilikSuresi, setGecerlilikSuresi] = useState(30)
    const [notlar, setNotlar] = useState('')
    const [fiyatlar, setFiyatlar] = useState<Record<number, number>>({})

    useEffect(() => {
        async function fetchData() {
            // @ts-ignore
            if (session?.user?.tedarikciId && id) {
                // @ts-ignore
                const data = await getRFQWithOffer(Number(id), session.user.tedarikciId)
                if (data) {
                    setRfq(data)
                    // Önceki teklif varsa formları doldur
                    if (data.teklif) {
                        setTeslimSuresi(data.teklif.teslimSuresi)
                        setVadeGun(data.teklif.vadeGun)
                        setGecerlilikSuresi(data.teklif.gecerlilikSuresi)
                        setNotlar(data.teklif.notlar || '')

                        const savedFiyatlar: Record<number, number> = {}
                        data.teklif.kalemler.forEach((k: any) => {
                            savedFiyatlar[k.rfqKalemId] = Number(k.birimFiyat)
                        })
                        setFiyatlar(savedFiyatlar)
                    }
                }
            }
            setLoading(false)
        }
        fetchData()
    }, [id, session])

    const calculateTotal = () => {
        return rfq.kalemler.reduce((acc: number, k: any) => {
            const birimFiyat = fiyatlar[k.id] || 0
            const miktar = k.miktar || k.talepKalem.miktar || 0
            return acc + (birimFiyat * miktar)
        }, 0)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        // @ts-ignore
        if (!session?.user?.tedarikciId || !id) return

        // Validasyon
        const eksikFiyat = rfq.kalemler.some((k: any) => !fiyatlar[k.id] || fiyatlar[k.id] <= 0)
        if (eksikFiyat) {
            showAlert('Lütfen tüm kalemler için geçerli bir birim fiyat giriniz.', 'error')
            return
        }

        setSubmitting(true)
        const input = {
            rfqId: Number(id),
            // @ts-ignore
            supplierId: session.user.tedarikciId,
            teslimSuresi,
            vadeGun,
            gecerlilikSuresi,
            notlar,
            kalemler: rfq.kalemler.map((k: any) => ({
                rfqKalemId: k.id,
                talepKalemId: k.talepKalemId,
                birimFiyat: fiyatlar[k.id]
            }))
        }

        const result = await submitSupplierOffer(input)
        setSubmitting(false)

        if (result.success) {
            showAlert('Teklifiniz başarıyla gönderildi.', 'success')
            // Hemen yönlendirme yerine belge yükleme alanını göster
            if (result.teklifId) {
                setSubmittedTeklifId(result.teklifId)
                window.scrollTo({ top: 0, behavior: 'smooth' })
            } else {
                router.push('/portal/tedarikci/rfq')
            }
        } else {
            showAlert(result.error || 'Hata oluştu', 'error')
        }
    }

    if (loading) return <div className="p-8 text-center text-slate-500 font-medium">Veriler yükleniyor...</div>
    if (!rfq) return <div className="p-8 text-center text-rose-500 font-bold">RFQ bulunamadı veya erişim yetkiniz yok.</div>

    if (submittedTeklifId) {
        return (
            <div className="max-w-xl mx-auto py-20 px-4 text-center space-y-8 animate-in fade-in zoom-in-95 duration-500">
                <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-sm">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight mb-2">Teklifiniz Alındı!</h1>
                    <p className="text-slate-500">Fiyat teklifiniz başarıyla sisteme kaydedilmiştir. <br /> Varsa teknik şartname, ürün kataloğu veya ek dökümanları aşağıdan yükleyebilirsiniz.</p>
                </div>

                <div className="bg-white p-6 rounded-2xl border-2 border-dashed border-slate-200">
                    <FileUpload
                        relatedEntity="TEKLIF"
                        entityId={submittedTeklifId}
                        label="TEKLİF DÖKÜMANLARINI YÜKLE"
                    />
                </div>

                <button
                    onClick={() => router.push('/portal/tedarikci/rfq')}
                    className="w-full bg-slate-900 text-white py-4 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-teal-600 transition-all shadow-xl shadow-slate-200"
                >
                    İşlemi Tamamla ve Geri Dön
                </button>
            </div>
        )
    }
    if (!rfq) return <div className="p-8 text-center text-rose-500 font-bold">RFQ bulunamadı veya erişim yetkiniz yok.</div>

    return (
        <form onSubmit={handleSubmit} className="max-w-5xl mx-auto space-y-6 pb-20">
            {/* Header */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded uppercase">
                                {rfq.rfqNo}
                            </span>
                            <h1 className="text-2xl font-bold text-slate-800">{rfq.baslik}</h1>
                        </div>
                        <p className="text-sm text-slate-500 max-w-2xl">{rfq.aciklama || 'Açıklama belirtilmemiş.'}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Son Teklif Tarihi</p>
                        <p className="text-lg font-black text-rose-600">
                            {new Date(rfq.sonTeklifTarihi).toLocaleDateString('tr-TR')}
                            <span className="text-xs ml-1 opacity-70">
                                {new Date(rfq.sonTeklifTarihi).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-slate-100">
                    <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">RFQ Oluşturma</p>
                        <p className="text-sm text-slate-700 font-medium">{new Date(rfq.olusturmaTarihi).toLocaleDateString('tr-TR')}</p>
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Mevcut Tur</p>
                        <p className="text-sm text-slate-700 font-medium">{rfq.mevcutTur} / {rfq.maksimumTur}</p>
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Teklif Durumu</p>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${rfq.teklif ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
                            }`}>
                            {rfq.teklif ? 'Güncellenebilir' : 'Yeni Teklif'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Kalemler */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Talep Edilen Kalemler</h3>
                </div>
                <table className="w-full text-left">
                    <thead className="bg-slate-50/80 text-[10px] uppercase font-bold text-slate-400 tracking-widest border-b border-slate-100">
                        <tr>
                            <th className="px-6 py-3">Kalem Bilgisi</th>
                            <th className="px-6 py-3">Miktar</th>
                            <th className="px-6 py-3 w-48">Birim Fiyat (TL)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {rfq.kalemler.map((kalem: any) => (
                            <tr key={kalem.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4">
                                    <p className="text-sm font-bold text-slate-800">{kalem.talepKalem.aciklama}</p>
                                    <p className="text-[10px] text-slate-500 mt-1">{kalem.talepKalem.detay || '-'}</p>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-sm font-medium text-slate-700 bg-slate-100 px-2 py-1 rounded">
                                        {kalem.miktar || kalem.talepKalem.miktar} {kalem.talepKalem.birim}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="relative">
                                        <input
                                            type="number"
                                            step="0.01"
                                            required
                                            value={fiyatlar[kalem.id] || ''}
                                            onChange={(e) => setFiyatlar({ ...fiyatlar, [kalem.id]: Number(e.target.value) })}
                                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 outline-none transition-all"
                                            placeholder="0,00"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">₺</span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Teklif Koşulları */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-2">Teslimat ve Ödeme</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Teslim Süresi (Gün)</label>
                            <input
                                type="number"
                                required
                                value={teslimSuresi}
                                onChange={(e) => setTeslimSuresi(Number(e.target.value))}
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-teal-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Vade (Gün)</label>
                            <input
                                type="number"
                                required
                                value={vadeGun}
                                onChange={(e) => setVadeGun(Number(e.target.value))}
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-teal-500 outline-none"
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Teklif Geçerlilik (Gün)</label>
                            <input
                                type="number"
                                required
                                value={gecerlilikSuresi}
                                onChange={(e) => setGecerlilikSuresi(Number(e.target.value))}
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-teal-500 outline-none"
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-2">Notlar ve Açıklamalar</h3>
                    <textarea
                        rows={5}
                        value={notlar}
                        onChange={(e) => setNotlar(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-teal-500 outline-none resize-none"
                        placeholder="Teklifinize dair eklemek istediğiniz notlar..."
                    />
                </div>
            </div>

            {/* Sticky Actions Bar */}
            <div className="fixed bottom-0 left-0 right-0 md:left-64 bg-white/80 backdrop-blur-md border-t border-slate-200 p-4 z-40">
                <div className="max-w-5xl mx-auto flex justify-between items-center">
                    <div className="hidden sm:block">
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Tahmini Toplam Tutar</p>
                        <p className="text-xl font-black text-slate-900">
                            {calculateTotal().toLocaleString('tr-TR')} ₺
                        </p>
                    </div>
                    <div className="flex gap-4 w-full sm:w-auto">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="flex-1 sm:flex-none px-6 py-3 bg-slate-100 text-slate-600 text-[11px] font-bold uppercase rounded-xl hover:bg-slate-200 transition-all border border-slate-200"
                        >
                            İptal
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className={`flex-1 sm:flex-none px-12 py-3 bg-slate-800 text-white text-[11px] font-bold uppercase rounded-xl transition-all shadow-xl ${submitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-teal-600 shadow-teal-500/20'
                                }`}
                        >
                            {submitting ? 'Gönderiliyor...' : (rfq.teklif ? 'Teklifi Güncelle' : 'Teklifi Gönder')}
                        </button>
                    </div>
                </div>
            </div>
        </form>
    )
}
