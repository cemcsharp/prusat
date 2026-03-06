'use client'

import { useState, useEffect } from 'react'
import { getTalepByToken, submitTeklif, getTedarikciKategorileri, completeSupplierRegistration } from '@/lib/actions'
import { useNotification } from '@/context/NotificationContext'
import FileUpload from '@/components/FileUpload'
import AttachmentList from '@/components/AttachmentList'

export default function TeklifPage({ params }: { params: Promise<{ token: string }> }) {
    const [token, setToken] = useState<string>('')
    const [data, setData] = useState<any>(null)
    const [error, setError] = useState<string>('')
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const { showAlert } = useNotification()
    const [refreshFiles, setRefreshFiles] = useState(0)

    // Kayıt Paneli Durumları
    const [showRegistration, setShowRegistration] = useState(false)
    const [kategoriler, setKategoriler] = useState<any[]>([])
    const [regData, setRegData] = useState({
        ad: '',
        yetkiliKisi: '',
        telefon: '',
        adres: '',
        vergiNo: '',
        kategoriId: ''
    })

    const [kalemFiyatlar, setKalemFiyatlar] = useState<{ [key: number]: string }>({})
    const [teslimSuresi, setTeslimSuresi] = useState('')
    const [gecerlilikSuresi, setGecerlilikSuresi] = useState('30')
    const [paraBirimi, setParaBirimi] = useState('TRY')
    const [notlar, setNotlar] = useState('')
    const [odemePlani, setOdemePlani] = useState<{ oran: number, vadeGun: number, aciklama: string }[]>([
        { oran: 100, vadeGun: 30, aciklama: 'Standart Vade' }
    ])

    useEffect(() => {
        async function init() {
            const resolvedParams = await params
            setToken(resolvedParams.token)
            try {
                const result = await getTalepByToken(resolvedParams.token)
                setData(result)

                // Kayıt kontrolü: Eğer vergi no yoksa veya isim MISAFIR- ile başlıyorsa kayıt formunu aç
                const tedarikci = result.tedarikci
                if (!tedarikci.vergiNo || tedarikci.ad.startsWith('MISAFIR-')) {
                    setShowRegistration(true)
                    setRegData({
                        ad: tedarikci.ad.startsWith('MISAFIR-') ? '' : tedarikci.ad,
                        yetkiliKisi: tedarikci.yetkiliKisi || '',
                        telefon: tedarikci.telefon || '',
                        adres: tedarikci.adres || '',
                        vergiNo: tedarikci.vergiNo || '',
                        kategoriId: tedarikci.kategoriId?.toString() || ''
                    })
                    const cats = await getTedarikciKategorileri()
                    setKategoriler(cats)
                }

                // Yeni turda önceki teklif verilerini form alanlarına doldur
                if (result.isNewRound && result.oncekiTeklif) {
                    const oncekiFiyatlar: { [key: number]: string } = {}
                    result.oncekiTeklif.kalemler.forEach((k: any) => {
                        oncekiFiyatlar[k.talepKalemId] = k.birimFiyat.toString()
                    })
                    setKalemFiyatlar(oncekiFiyatlar)
                    setTeslimSuresi(result.oncekiTeklif.teslimSuresi?.toString() || '')
                    setGecerlilikSuresi(result.oncekiTeklif.gecerlilikSuresi?.toString() || '30')
                    setParaBirimi(result.oncekiTeklif.paraBirimi || 'TRY')
                    setNotlar(result.oncekiTeklif.notlar || '')
                }
            } catch (err) {
                setError((err as Error).message)
            } finally {
                setLoading(false)
            }
        }
        init()
    }, [params])

    async function handleRegistrationSubmit(e: React.FormEvent) {
        e.preventDefault()
        setSubmitting(true)
        try {
            const result = await completeSupplierRegistration(data.tedarikci.id, {
                ...regData,
                kategoriId: parseInt(regData.kategoriId)
            })

            if (result.success) {
                setShowRegistration(false)
                showAlert('Kaydınız başarıyla tamamlandı, şimdi teklifinizi iletebilirsiniz.', 'success')
                // Veriyi tazele
                const updated = await getTalepByToken(token)
                setData(updated)
            } else {
                showAlert('Kayıt sırasında bir hata oluştu: ' + result.error, 'error')
            }
        } catch (err) {
            showAlert('Sistemsel hata: ' + (err as Error).message, 'error')
        } finally {
            setSubmitting(false)
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        // Validasyon
        const kalemler = Object.entries(kalemFiyatlar).map(([id, fiyat]) => ({
            talepKalemId: parseInt(id),
            birimFiyat: parseFloat(fiyat) || 0
        }))

        if (kalemler.some(k => k.birimFiyat <= 0)) {
            showAlert('Lütfen tüm kalemler için geçerli bir fiyat girin', 'warning')
            return
        }

        if (!teslimSuresi || parseInt(teslimSuresi) <= 0) {
            showAlert('Lütfen geçerli bir teslimat süresi girin', 'warning')
            return
        }

        setSubmitting(true)
        try {
            await submitTeklif(token, {
                kalemler,
                teslimSuresi: parseInt(teslimSuresi),
                gecerlilikSuresi: parseInt(gecerlilikSuresi),
                paraBirimi,
                notlar,
                odemePlani: odemePlani.map(p => ({
                    ...p,
                    oran: Number(p.oran),
                    vadeGun: Number(p.vadeGun)
                }))
            })
            setSubmitted(true)
            showAlert('Teklifiniz başarıyla iletildi', 'success')
        } catch (err) {
            showAlert('Hata: ' + (err as Error).message, 'error')
        } finally {
            setSubmitting(false)
        }
    }

    // Toplam hesaplama
    const toplamTutar = data?.talep?.kalemler?.reduce((sum: number, k: any) => {
        const fiyat = parseFloat(kalemFiyatlar[k.id] || '0')
        return sum + (fiyat * k.miktar)
    }, 0) || 0

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-slate-300 border-t-slate-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600 text-sm">Yükleniyor...</p>
                </div>
            </div>
        )
    }

    if (submitted) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                    <div className="text-6xl mb-4">✅</div>
                    <h1 className="text-2xl font-bold text-slate-800 mb-2">Teklifiniz Alındı!</h1>
                    <p className="text-slate-600 mb-4">Teklif talebiniz başarıyla iletildi. En kısa sürede değerlendirilerek size geri dönüş yapılacaktır.</p>
                    <div className="bg-slate-50 rounded-lg p-4 text-left text-sm text-slate-600">
                        <p><strong>Talep No:</strong> {data.talep.barkod}</p>
                        <p><strong>Toplam Tutar:</strong> {toplamTutar.toLocaleString('tr-TR')} {paraBirimi}</p>
                        <p><strong>Teslimat Süresi:</strong> {teslimSuresi} gün</p>
                    </div>

                    {/* Satın Alma Yetkilisi Bilgileri */}
                    <div className="mt-6 pt-6 border-t border-slate-100 text-left">
                        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <span>👤</span> Satın Alma Yetkilisi
                        </h3>
                        <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-100 flex items-center gap-4">
                            <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold shadow-md shadow-indigo-100 uppercase">
                                {(data.rfqTedarikci?.rfq?.olusturan?.adSoyad || data.rfqTedarikci?.rfq?.olusturan?.ad || data.talep?.ilgiliKisi?.adSoyad || data.talep?.ilgiliKisi?.ad || 'SA').substring(0, 2)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-slate-800 truncate uppercase">
                                    {data.rfqTedarikci?.rfq?.olusturan?.adSoyad || data.rfqTedarikci?.rfq?.olusturan?.ad || data.talep?.ilgiliKisi?.adSoyad || data.talep?.ilgiliKisi?.ad || 'Satınalma Departmanı'}
                                </p>
                                <div className="flex flex-col gap-0.5 mt-0.5">
                                    <p className="text-[11px] text-slate-500 font-medium truncate flex items-center gap-1">
                                        <span>📧</span> {data.rfqTedarikci?.rfq?.olusturan?.email || data.talep?.ilgiliKisi?.email || 'E-posta belirtilmemiş'}
                                    </p>
                                    {(data.rfqTedarikci?.rfq?.olusturan?.telefon || data.talep?.ilgiliKisi?.telefon) && (
                                        <p className="text-[11px] text-slate-500 font-medium truncate flex items-center gap-1">
                                            <span>📞</span>
                                            <a href={`tel:${data.rfqTedarikci?.rfq?.olusturan?.telefon || data.talep?.ilgiliKisi?.telefon}`} className="hover:text-indigo-600 transition-colors">
                                                {data.rfqTedarikci?.rfq?.olusturan?.telefon || data.talep?.ilgiliKisi?.telefon}
                                            </a>
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-3 text-center uppercase tracking-tighter">
                            Sorularınız için satın alma yetkilisi ile iletişime geçebilirsiniz.
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                    <div className="text-5xl mb-4">⚠️</div>
                    <h1 className="text-xl font-bold text-slate-800 mb-2">Erişim Hatası</h1>
                    <p className="text-slate-600">{error}</p>
                </div>
            </div>
        )
    }

    if (showRegistration) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 py-8 px-4 flex items-center justify-center">
                <div className="max-w-xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                    <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 px-8 py-6 text-white">
                        <h1 className="text-xl font-bold tracking-wide">Tedarikçi Kayıt Formu</h1>
                        <p className="text-indigo-100 text-xs mt-1">Teklif verebilmek için lütfen firma bilgilerinizi tamamlayınız.</p>
                    </div>

                    <form onSubmit={handleRegistrationSubmit} className="p-8 space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Resmi Firma Ünvanı</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                                    placeholder="Örn: ABC İnşaat Ltd. Şti."
                                    value={regData.ad}
                                    onChange={(e) => setRegData({ ...regData, ad: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Vergi No / TCKN</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                                    placeholder="1234567890"
                                    value={regData.vergiNo}
                                    onChange={(e) => setRegData({ ...regData, vergiNo: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Ana Faaliyet Alanı</label>
                                <select
                                    required
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                                    value={regData.kategoriId}
                                    onChange={(e) => setRegData({ ...regData, kategoriId: e.target.value })}
                                >
                                    <option value="">Kategori Seçiniz...</option>
                                    {kategoriler.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.ad}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Yetkili Kişi</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                                    placeholder="Ad Soyad"
                                    value={regData.yetkiliKisi}
                                    onChange={(e) => setRegData({ ...regData, yetkiliKisi: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Telefon</label>
                                <input
                                    type="tel"
                                    required
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                                    placeholder="05xx xxx xx xx"
                                    value={regData.telefon}
                                    onChange={(e) => setRegData({ ...regData, telefon: e.target.value })}
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Firma Adresi</label>
                                <textarea
                                    required
                                    rows={2}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all resize-none"
                                    placeholder="Merkez mah. ..."
                                    value={regData.adres}
                                    onChange={(e) => setRegData({ ...regData, adres: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={submitting}
                                className={`w-full py-4 rounded-xl text-white font-bold uppercase tracking-widest transition-all shadow-lg ${submitting
                                    ? 'bg-slate-400 cursor-not-allowed'
                                    : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-200'
                                    }`}
                            >
                                {submitting ? 'Kaydediliyor...' : 'Kaydı Tamamla ve Teklif Ekranına Geç'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 py-8 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6">
                    <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-6 py-4 text-white">
                        <h1 className="text-lg font-bold tracking-wide">Teklif Formu</h1>
                        <p className="text-slate-300 text-xs mt-1">Satınalma Teklif Sistemi</p>
                    </div>

                    {/* Yeni Tur Banner */}
                    {data.isNewRound && (
                        <div className="bg-blue-500 text-white px-6 py-3">
                            <div className="flex items-center gap-2">
                                <span className="text-xl">🔄</span>
                                <div>
                                    <p className="font-bold">TUR {data.currentRound} - Revize Teklif</p>
                                    <p className="text-blue-100 text-xs">Önceki teklifinizi revize etmeniz bekleniyor</p>
                                </div>
                            </div>
                            {data.oncekiTeklif && (
                                <div className="mt-2 bg-blue-600/50 rounded p-2 text-xs">
                                    <p>Önceki Teklifiniz (Tur {data.oncekiTeklif.turNo}): <strong>{Number(data.oncekiTeklif.toplamTutar).toLocaleString('tr-TR')} {data.oncekiTeklif.paraBirimi}</strong></p>
                                </div>
                            )}
                        </div>
                    )}


                    <div className="p-6 border-b border-slate-100">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-slate-400 text-xs uppercase">Talep No</span>
                                <p className="font-bold text-slate-800">{data.talep.barkod}</p>
                            </div>
                            <div>
                                <span className="text-slate-400 text-xs uppercase">Tarih</span>
                                <p className="font-medium text-slate-600">{new Date(data.talep.tarih).toLocaleDateString('tr-TR')}</p>
                            </div>
                            <div className="col-span-2">
                                <span className="text-slate-400 text-xs uppercase">Konu</span>
                                <p className="font-medium text-slate-600">{data.talep.konu}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    {/* Kalemler */}
                    <div className="p-6 border-b border-slate-100">
                        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">Talep Kalemleri</h2>
                        <div className="space-y-4">
                            {data.talep.kalemler.map((kalem: any) => (
                                <div key={kalem.id} className="bg-slate-50 rounded-xl p-4">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <p className="font-medium text-slate-800">{kalem.aciklama}</p>
                                            <p className="text-sm text-slate-500">{kalem.miktar} {kalem.birim}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-slate-500">Birim Fiyat:</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            placeholder="0.00"
                                            className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-400"
                                            value={kalemFiyatlar[kalem.id] || ''}
                                            onChange={(e) => setKalemFiyatlar({ ...kalemFiyatlar, [kalem.id]: e.target.value })}
                                            required
                                        />
                                        <select
                                            className="bg-white border border-slate-200 rounded-lg px-2 py-2 text-sm outline-none"
                                            value={paraBirimi}
                                            onChange={(e) => setParaBirimi(e.target.value)}
                                        >
                                            <option value="TRY">₺ TRY</option>
                                            <option value="USD">$ USD</option>
                                            <option value="EUR">€ EUR</option>
                                        </select>
                                    </div>
                                    {kalemFiyatlar[kalem.id] && (
                                        <p className="text-right text-xs text-slate-500 mt-2">
                                            Ara Toplam: {(parseFloat(kalemFiyatlar[kalem.id]) * kalem.miktar).toLocaleString('tr-TR')} {paraBirimi}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Ek Bilgiler */}
                    <div className="p-6 border-b border-slate-100">
                        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">Teklif Bilgileri</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-slate-500 mb-1">Teslimat Süresi (Gün)</label>
                                <input
                                    type="number"
                                    min="1"
                                    placeholder="Örn: 15"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-400"
                                    value={teslimSuresi}
                                    onChange={(e) => setTeslimSuresi(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-500 mb-1">Teklif Geçerlilik (Gün)</label>
                                <input
                                    type="number"
                                    min="1"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-400"
                                    value={gecerlilikSuresi}
                                    onChange={(e) => setGecerlilikSuresi(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-xs text-slate-500 mb-1">Notlar (Opsiyonel)</label>
                                <textarea
                                    rows={3}
                                    placeholder="Ek bilgiler, koşullar veya açıklamalar..."
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-400 resize-none"
                                    value={notlar}
                                    onChange={(e) => setNotlar(e.target.value)}
                                />
                            </div>

                            {/* Parçalı Vade / Ödeme Planı */}
                            <div className="col-span-2 mt-4 pt-4 border-t border-slate-100">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
                                        <span>📅</span> Ödeme Planı (Vade Seçenekleri)
                                    </h3>
                                    <button
                                        type="button"
                                        onClick={() => setOdemePlani([...odemePlani, { oran: 0, vadeGun: 30, aciklama: '' }])}
                                        className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg font-bold transition-all uppercase tracking-tighter"
                                    >
                                        + Yeni Vade Ekle
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {odemePlani.map((plan, index) => (
                                        <div key={index} className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                            <div className="w-20">
                                                <label className="block text-[9px] text-slate-400 uppercase font-bold mb-1">Oran (%)</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="100"
                                                    className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-indigo-400"
                                                    value={plan.oran}
                                                    onChange={(e) => {
                                                        const newPlan = [...odemePlani]
                                                        newPlan[index].oran = parseInt(e.target.value) || 0
                                                        setOdemePlani(newPlan)
                                                    }}
                                                    required
                                                />
                                            </div>
                                            <div className="w-24">
                                                <label className="block text-[9px] text-slate-400 uppercase font-bold mb-1">Vade (Gün)</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-indigo-400"
                                                    value={plan.vadeGun}
                                                    onChange={(e) => {
                                                        const newPlan = [...odemePlani]
                                                        newPlan[index].vadeGun = parseInt(e.target.value) || 0
                                                        setOdemePlani(newPlan)
                                                    }}
                                                    required
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <label className="block text-[9px] text-slate-400 uppercase font-bold mb-1">Açıklama</label>
                                                <input
                                                    type="text"
                                                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-indigo-400"
                                                    placeholder="Peşinat, Teslimatta vb."
                                                    value={plan.aciklama}
                                                    onChange={(e) => {
                                                        const newPlan = [...odemePlani]
                                                        newPlan[index].aciklama = e.target.value
                                                        setOdemePlani(newPlan)
                                                    }}
                                                />
                                            </div>
                                            {odemePlani.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => setOdemePlani(odemePlani.filter((_, i) => i !== index))}
                                                    className="text-slate-400 hover:text-rose-500 transition-colors p-1 mt-4"
                                                >
                                                    ✕
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-3 flex justify-between items-center px-1">
                                    <p className="text-[10px] text-slate-400 italic">
                                        İpucu: Peşin ödemeler için gün değerini 0 giriniz.
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase">Toplam Oran:</span>
                                        <span className={`text-xs font-bold ${odemePlani.reduce((sum, p) => sum + p.oran, 0) === 100 ? 'text-emerald-600' : 'text-rose-500'}`}>
                                            %{odemePlani.reduce((sum, p) => sum + p.oran, 0)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Dosya Yükleme Alanı */}
                            <div className="col-span-2 mt-4 pt-4 border-t border-slate-100">
                                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <span>📎</span> Teklif Dokümanları (Opsiyonel)
                                </h3>
                                <AttachmentList
                                    relatedEntity="TEKLIF_TOKEN_DRAFT"
                                    entityId={data.id}
                                    refreshTrigger={refreshFiles}
                                />
                                <div className="mt-3">
                                    <FileUpload
                                        relatedEntity="TEKLIF_TOKEN_DRAFT"
                                        entityId={data.id}
                                        onSuccess={() => setRefreshFiles(prev => prev + 1)}
                                        label="Teklif Dosyası / Katalog Ekle"
                                    />
                                </div>
                                <p className="text-[10px] text-slate-400 mt-2 uppercase tracking-tighter">
                                    Teklifinizle ilgili teknik döküman, sertifika veya katalog yükleyebilirsiniz.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Toplam ve Gönder */}
                    <div className="p-6 bg-slate-50">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-sm font-medium text-slate-600">Toplam Tutar:</span>
                            <span className="text-2xl font-bold text-slate-800">
                                {toplamTutar.toLocaleString('tr-TR')} {paraBirimi}
                            </span>
                        </div>
                        <button
                            type="submit"
                            disabled={submitting}
                            className={`w-full py-3 rounded-xl text-white font-bold uppercase tracking-wider transition-all ${submitting
                                ? 'bg-slate-400 cursor-not-allowed'
                                : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg hover:shadow-xl'
                                }`}
                        >
                            {submitting ? 'Gönderiliyor...' : 'Teklifi Gönder'}
                        </button>
                    </div>
                </form>

                {/* Footer */}
                <p className="text-center text-xs text-slate-400 mt-6">
                    Bu sayfa sadece teklif göndermek için kullanılabilir.
                </p>
            </div>
        </div>
    )
}
