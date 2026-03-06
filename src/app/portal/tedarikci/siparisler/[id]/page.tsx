'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { getOrderDetails, createSupplierInvoice } from '@/lib/portalActions'
import { useNotification } from '@/context/NotificationContext'

export default function SupplierOrderDetailPage() {
    const { id } = useParams()
    const { data: session } = useSession()
    const router = useRouter()
    const { showAlert, showConfirm } = useNotification()
    const [order, setOrder] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [showInvoiceModal, setShowInvoiceModal] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    // Invoice Form State
    const [invoiceNo, setInvoiceNo] = useState('')
    const [invoiceTutar, setInvoiceTutar] = useState(0)
    const [vadeTarihi, setVadeTarihi] = useState('')
    const [selectedFile, setSelectedFile] = useState<File | null>(null)

    useEffect(() => {
        async function fetchData() {
            // @ts-ignore
            if (session?.user?.tedarikciId && id) {
                // @ts-ignore
                const data = await getOrderDetails(Number(id), session.user.tedarikciId)
                if (data) {
                    setOrder(data)
                    // Varsayılan fatura tutarı toplam tutar olsun
                    setInvoiceTutar(Number(data.teklifKabul?.toplamTutar || 0))
                    // Varsayılan vade tarihi bugün + 30 gün olsun
                    const d = new Date()
                    d.setDate(d.getDate() + 30)
                    setVadeTarihi(d.toISOString().split('T')[0])
                }
            }
            setLoading(false)
        }
        fetchData()
    }, [id, session])

    const handleCreateInvoice = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!invoiceNo || invoiceTutar <= 0 || !vadeTarihi) {
            showAlert('Lütfen tüm alanları eksiksiz doldurunuz.', 'error')
            return
        }

        setSubmitting(true)

        try {
            // 1. Faturayı oluştur
            const result = await createSupplierInvoice({
                siparisId: Number(id),
                faturaNo: invoiceNo,
                tutar: invoiceTutar,
                vadeTarihi: new Date(vadeTarihi)
            })

            if (!result.success) {
                showAlert(result.error || 'Fatura oluşturulamadı', 'error')
                setSubmitting(false)
                return
            }

            // 2. Eğer dosya seçildiyse yükle
            if (selectedFile && result.faturaId) {
                const formData = new FormData()
                formData.append('file', selectedFile)
                formData.append('relatedEntity', 'FATURA') // Model enum'ına dikkat
                formData.append('entityId', result.faturaId.toString())

                const uploadRes = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData
                })

                if (!uploadRes.ok) {
                    // Dosya yükleme başarısız olsa bile fatura oluştu, kullanıcıya bilgi verelim
                    showAlert('Fatura oluşturuldu ancak dosya yüklenemedi.', 'warning')
                    setShowInvoiceModal(false)
                    window.location.reload()
                    return
                }
            }

            showAlert('Fatura ve dosya başarıyla kaydedildi.', 'success')
            setShowInvoiceModal(false)
            window.location.reload()

        } catch (error) {
            console.error('İşlem hatası:', error)
            showAlert('Bir hata oluştu.', 'error')
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) return <div className="p-8 text-center text-slate-500 font-medium tracking-tight">Yükleniyor...</div>
    if (!order) return <div className="p-8 text-center text-rose-500 font-bold">Sipariş bulunamadı veya erişim yetkiniz yok.</div>

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-20">
            {/* Header / Özet */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between gap-6">
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold rounded uppercase">
                            {order.barkod}
                        </span>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Sipariş Detayı</h1>
                    </div>
                    <p className="text-sm text-slate-500 leading-relaxed max-w-xl">
                        {order.talep?.konu || 'Konu belirtilmemiş'} - {order.aciklama || 'Açıklama yok'}
                    </p>
                    <div className="flex gap-4 pt-2">
                        <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                            <p className="text-[9px] text-slate-400 uppercase font-bold tracking-widest mb-0.5">Sipariş Tarihi</p>
                            <p className="text-xs font-bold text-slate-700">{new Date(order.tarih).toLocaleDateString('tr-TR')}</p>
                        </div>
                        <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                            <p className="text-[9px] text-slate-400 uppercase font-bold tracking-widest mb-0.5">Durum</p>
                            <p className="text-xs font-bold text-teal-600 uppercase">{order.durum}</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-4 min-w-[240px]">
                    <div className="text-right bg-slate-900 px-6 py-4 rounded-2xl shadow-xl shadow-slate-200 w-full">
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Toplam Sipariş Tutarı</p>
                        <p className="text-2xl font-black text-white italic">
                            {Number(order.teklifKabul?.toplamTutar || 0).toLocaleString('tr-TR')}
                            <span className="text-sm ml-1 text-slate-400 not-italic">{order.teklifKabul?.paraBirimi || 'TRY'}</span>
                        </p>
                    </div>
                    <button
                        onClick={() => setShowInvoiceModal(true)}
                        className="w-full py-3.5 bg-teal-600 text-white text-[11px] font-bold uppercase rounded-xl hover:bg-teal-700 transition-all shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2"
                    >
                        <span>🧾</span>
                        Fatura Oluştur
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Sol Kolon: Kalemler */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest">Sipariş Kalemleri</h3>
                        </div>
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/80 text-[10px] uppercase font-bold text-slate-400 tracking-widest border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-3">Açıklama</th>
                                    <th className="px-6 py-3">Miktar</th>
                                    <th className="px-6 py-3 text-right">Birim Fiyat</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {order.teklifKabul?.kalemler?.map((kalem: any) => (
                                    <tr key={kalem.id} className="group">
                                        <td className="px-6 py-4 text-xs font-semibold text-slate-700">
                                            {kalem.aciklama || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-xs text-slate-500">
                                            {kalem.miktar} {kalem.birim || 'Adet'}
                                        </td>
                                        <td className="px-6 py-4 text-xs font-bold text-slate-900 text-right">
                                            {Number(kalem.birimFiyat).toLocaleString('tr-TR')} {order.teklifKabul?.paraBirimi}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest mb-2">Ödeme Planı Detayı</h3>
                        {order.odemePlani?.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {order.odemePlani.map((pay: any, idx: number) => (
                                    <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center">
                                        <div>
                                            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">Vade / Oran</p>
                                            <p className="text-sm font-bold text-slate-800">{pay.vadeGun} Gün / %{pay.oran}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-slate-500">{pay.aciklama || 'Planlanmış Ödeme'}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-slate-400 italic">Bu sipariş için spesifik bir ödeme planı tanımlanmamış.</p>
                        )}
                    </div>
                </div>

                {/* Sağ Kolon: Mevcut Faturalar */}
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest mb-6">Kayıtlı Faturalar</h3>
                        {order.faturalar?.length > 0 ? (
                            <div className="space-y-4 font-inter">
                                {order.faturalar.map((inv: any) => (
                                    <div key={inv.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-teal-100 transition-all group">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <p className="text-[10px] text-slate-400 uppercase font-bold">Fatura No</p>
                                                <p className="text-sm font-bold text-slate-800">{inv.faturaNo}</p>
                                            </div>
                                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${inv.odemeDurumu === 'ODENDI' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                                }`}>
                                                {inv.odemeDurumu}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <p className="text-[10px] text-slate-400 uppercase font-bold mt-1">Vade</p>
                                                <p className="text-xs text-slate-600 font-medium">
                                                    {new Date(inv.vadeTarihi).toLocaleDateString('tr-TR')}
                                                </p>
                                            </div>
                                            <p className="text-sm font-black text-slate-800 group-hover:text-teal-600 transition-colors">
                                                {Number(inv.tutar).toLocaleString('tr-TR')} ₺
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10 opacity-40">
                                <span className="text-4xl mb-4 block">📄</span>
                                <p className="text-xs font-medium">Kayıtlı fatura bulunamadı</p>
                            </div>
                        )}
                    </div>

                    <div className="bg-teal-600 p-6 rounded-2xl border border-teal-500 shadow-lg shadow-teal-900/10 text-white space-y-3">
                        <h4 className="text-xs font-black uppercase tracking-widest opacity-80">Portal Notu</h4>
                        <p className="text-[11px] leading-relaxed opacity-90 font-medium">
                            Fatura kaydı oluştururken evrak numaranızın doğruluğundan emin olun. Onaylanan faturalar finans modülünde ödeme takvimine dahil edilir.
                        </p>
                    </div>
                </div>
            </div>

            {/* Fatura Modal */}
            {showInvoiceModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                            <h2 className="text-xl font-black text-slate-800 italic uppercase tracking-tight">Yeni Fatura Girişi</h2>
                            <p className="text-xs text-slate-400 mt-1 font-medium">Sipariş: {order.barkod}</p>
                        </div>
                        <form onSubmit={handleCreateInvoice} className="p-8 space-y-5">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Fatura Numarası</label>
                                <input
                                    type="text"
                                    required
                                    value={invoiceNo}
                                    onChange={(e) => setInvoiceNo(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:border-teal-500 outline-none transition-all font-bold text-slate-700"
                                    placeholder="örn: ABC2026000001"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Tutar (₺)</label>
                                    <input
                                        type="number"
                                        required
                                        value={invoiceTutar}
                                        onChange={(e) => setInvoiceTutar(Number(e.target.value))}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:border-teal-500 outline-none transition-all font-black text-slate-800"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Vade Tarihi</label>
                                    <input
                                        type="date"
                                        required
                                        value={vadeTarihi}
                                        onChange={(e) => setVadeTarihi(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:border-teal-500 outline-none transition-all font-bold text-slate-700"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                                    Fatura Görseli / PDF <span className="text-slate-300 font-normal normal-case ml-1">(İsteğe Bağlı)</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="file"
                                        accept=".pdf,.png,.jpg,.jpeg"
                                        onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs focus:bg-white focus:border-teal-500 outline-none transition-all file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
                                    />
                                </div>
                                <p className="text-[9px] text-slate-400 mt-1.5 ml-1">Kabul edilen: PDF, JPEG, PNG (Maks 10MB)</p>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowInvoiceModal(false)}
                                    className="flex-1 py-3.5 bg-slate-100 text-slate-500 text-[11px] font-black uppercase rounded-xl hover:bg-slate-200 transition-all border border-slate-200"
                                >
                                    Vazgeç
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 py-3.5 bg-slate-900 text-white text-[11px] font-black uppercase rounded-xl hover:bg-teal-600 transition-all shadow-xl shadow-slate-200 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {submitting && <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                                    {submitting ? 'İşleniyor...' : 'Faturayı Kaydet'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

