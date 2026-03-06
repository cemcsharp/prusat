'use client'

import React, { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { getRFQById, getTedarikcisByKategori, addTedarikcilerToRFQ, sendRFQToSuppliers, selectKalemTedarikci, createOrdersFromRFQ, getBirimler, getYonetmelikMaddeleri, getAlimYontemleri, updateRFQStatus, earlyCloseRFQ, startNewRound, closeCurrentRound, getPersoneller, getTedarikciKategorileri, inviteExternalSupplierToRFQ, getDegerlendirmeFormTipleri, submitManualOffer } from '@/lib/actions'
import { useNotification } from '@/context/NotificationContext'
import FileUpload from '@/components/FileUpload'
import AttachmentList from '@/components/AttachmentList'
import ManualOfferModal from '@/components/ManualOfferModal'
import { RfqPdfButton } from '@/components/ExportButtons'

export default function RFQDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params)
    const router = useRouter()
    const [rfq, setRfq] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const { showAlert, showConfirm } = useNotification()
    const [activeTab, setActiveTab] = useState('genel')

    // Tedarikçi seçimi
    const [availableTedarikcieler, setAvailableTedarikcieler] = useState<any[]>([])
    const [selectedTedarikciIds, setSelectedTedarikciIds] = useState<number[]>([])
    const [loadingTedarikci, setLoadingTedarikci] = useState(false)
    const [sending, setSending] = useState(false)

    // Sipariş oluşturma
    const [birimler, setBirimler] = useState<any[]>([])
    const [yonetmelikler, setYonetmelikler] = useState<any[]>([])
    const [alimYontemleri, setAlimYontemleri] = useState<any[]>([])
    const [formTipleri, setFormTipleri] = useState<any[]>([])
    const [siparisForm, setSiparisForm] = useState({ birimId: '', yonetmelikId: '', alimYontemiId: '', barkod: '', degerlendirmeFormTipiId: '' })
    const [creatingOrder, setCreatingOrder] = useState(false)
    const [isClosing, setIsClosing] = useState(false)

    // Tur Sistemi
    const [showNewRoundModal, setShowNewRoundModal] = useState(false)
    const [newRoundDate, setNewRoundDate] = useState('')
    const [startingRound, setStartingRound] = useState(false)
    const [refreshFiles, setRefreshFiles] = useState(0)
    const [externalEmail, setExternalEmail] = useState('')
    const [isInviting, setIsInviting] = useState(false)
    const [showOnlyTop5, setShowOnlyTop5] = useState(false)
    const [showManualOfferModal, setShowManualOfferModal] = useState(false)
    const [roundStep, setRoundStep] = useState(0) // 0: Tarih seçimi, 1: Saat seçimi


    useEffect(() => {
        fetchRFQ()
        fetchLookups()
    }, [])

    async function fetchRFQ() {
        try {
            const data = await getRFQById(parseInt(resolvedParams.id))
            setRfq(data)
            if (data?.kategoriId) {
                fetchTedarikcieler(data.kategoriId)
            }
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    async function fetchLookups() {
        const [b, y, a, f] = await Promise.all([
            getBirimler(),
            getYonetmelikMaddeleri(),
            getAlimYontemleri(),
            getDegerlendirmeFormTipleri()
        ])
        setBirimler(b)
        setYonetmelikler(y)
        setAlimYontemleri(a)
        setFormTipleri(f)
    }

    async function fetchTedarikcieler(kategoriId: number) {
        setLoadingTedarikci(true)
        try {
            const data = await getTedarikcisByKategori(kategoriId)
            setAvailableTedarikcieler(data)
        } catch (err) {
            console.error(err)
        } finally {
            setLoadingTedarikci(false)
        }
    }

    async function handleAddTedarikcieler() {
        if (selectedTedarikciIds.length === 0) return
        try {
            await addTedarikcilerToRFQ(rfq.id, selectedTedarikciIds)
            setSelectedTedarikciIds([])
            fetchRFQ()
        } catch (err) {
            showAlert('Hata: ' + (err as Error).message, 'error')
        }
    }

    async function handleSendRFQ() {
        if (rfq.tedarikciler.length === 0) {
            showAlert('Önce tedarikçi ekleyiniz.', 'warning')
            return
        }
        setSending(true)
        try {
            const results = await sendRFQToSuppliers(rfq.id)
            showAlert(`${results.length} tedarikçiye başarıyla gönderildi`, 'success')
            fetchRFQ()
        } catch (err) {
            showAlert('Hata: ' + (err as Error).message, 'error')
        } finally {
            setSending(false)
        }
    }

    async function handleSelectKalemTedarikci(rfqKalemId: number, teklifId: number) {
        try {
            await selectKalemTedarikci(rfqKalemId, teklifId)
            fetchRFQ()
        } catch (err) {
            showAlert('Hata: ' + (err as Error).message, 'error')
        }
    }

    async function handleCreateOrders() {
        if (!siparisForm.birimId || !siparisForm.yonetmelikId || !siparisForm.alimYontemiId || !siparisForm.barkod) {
            showAlert('Lütfen tüm alanları (Barkod dahil) doldurunuz.', 'warning')
            return
        }

        const secilenKalemSayisi = rfq.kalemler.filter((k: any) => k.siparisSecimi).length
        if (secilenKalemSayisi === 0) {
            showAlert('Önce kalemler için tedarikçi seçimi yapınız.', 'warning')
            return
        }

        setCreatingOrder(true)
        try {
            const siparisler = await createOrdersFromRFQ(
                rfq.id,
                parseInt(siparisForm.birimId),
                parseInt(siparisForm.yonetmelikId),
                parseInt(siparisForm.alimYontemiId),
                siparisForm.barkod,
                siparisForm.degerlendirmeFormTipiId ? parseInt(siparisForm.degerlendirmeFormTipiId) : undefined
            )
            showAlert(`${siparisler.length} sipariş oluşturuldu!`, 'success')
            router.push('/siparisler')
        } catch (err) {
            showAlert('Hata: ' + (err as Error).message, 'error')
        } finally {
            setCreatingOrder(false)
        }
    }

    async function handleEarlyClose() {
        const confirmed = await showConfirm('İhaleyi şimdi kapatmak istediğinize emin misiniz? Bekleyen tedarikçiler artık teklif veremeyecek ve mevcut linkler geçersiz olacaktır.')
        if (!confirmed) return

        setIsClosing(true)
        try {
            await earlyCloseRFQ(rfq.id)
            showAlert('İhale başarıyla erken kapatıldı', 'success')
            fetchRFQ()
        } catch (err) {
            showAlert('Hata: ' + (err as Error).message, 'error')
        } finally {
            setIsClosing(false)
        }
    }

    async function handleStartNewRound() {
        if (!newRoundDate) {
            showAlert('Lütfen yeni tur için bitiş tarihi seçin', 'warning')
            return
        }
        setStartingRound(true)
        try {
            const result = await startNewRound(rfq.id, new Date(newRoundDate))
            showAlert(`Tur ${result.turNo} başarıyla başlatıldı!`, 'success')
            setShowNewRoundModal(false)
            setNewRoundDate('')
            fetchRFQ()
        } catch (err) {
            showAlert('Hata: ' + (err as Error).message, 'error')
        } finally {
            setStartingRound(false)
        }
    }

    async function handleExternalInvite(e: React.FormEvent) {
        e.preventDefault()
        if (!externalEmail) return
        setIsInviting(true)
        try {
            await inviteExternalSupplierToRFQ(rfq.id, externalEmail)
            showAlert(`Davet gönderildi: ${externalEmail}`, 'success')
            setExternalEmail('')
            fetchRFQ()
        } catch (err) {
            showAlert('Hata: ' + (err as Error).message, 'error')
        } finally {
            setIsInviting(false)
        }
    }

    async function handleManualOfferSubmit(data: any) {
        try {
            await submitManualOffer(rfq.id, data)
            showAlert('Harici teklif başarıyla işlendi!', 'success')
            fetchRFQ()
        } catch (err) {
            showAlert('Hata: ' + (err as Error).message, 'error')
            throw err
        }
    }

    if (loading) {
        return (
            <div className="text-center py-12 text-slate-400">
                <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-500 rounded-full animate-spin mx-auto mb-2"></div>
                Yükleniyor...
            </div>
        )
    }

    if (!rfq) {
        return (
            <div className="text-center py-12">
                <div className="text-4xl mb-3">❌</div>
                <p className="text-slate-500">RFQ bulunamadı.</p>
            </div>
        )
    }

    const tabs = [
        { id: 'genel', label: 'Genel Bilgiler', icon: '📋' },
        { id: 'kalemler', label: 'Kalemler', icon: '📦' },
        { id: 'tedarikciler', label: 'Tedarikçiler', icon: '🏢' },
        { id: 'teklifler', label: 'Teklifler', icon: '💰' },
        { id: 'siparis', label: 'Sipariş', icon: '🛒' },
        { id: 'dokumanlar', label: 'Dokümanlar', icon: '📎' },
    ]

    const durumRenk = (durum: string) => {
        switch (durum) {
            case 'TASLAK': return 'badge-slate'
            case 'GONDERILDI': return 'badge-blue'
            case 'DEGERLENDIRILME': return 'badge-amber'
            case 'TAMAMLANDI': return 'badge-emerald'
            case 'IPTAL': return 'badge-rose'
            default: return 'badge-slate'
        }
    }

    // --- AKILLI PUANLAMA MOTORU ---
    const calculateScores = () => {
        if (!rfq || !rfq.teklifler || rfq.teklifler.length === 0) return []

        const currentOffers = rfq.teklifler.filter((t: any) => t.turNo === rfq.mevcutTur)
        if (currentOffers.length === 0) return []

        // Normalize edilecek değerleri topla
        const prices = currentOffers.map((t: any) => Number(t.toplamTutar))
        const deliveryTimes = currentOffers.map((t: any) => t.teslimSuresi)
        const vades = currentOffers.map((t: any) => t.vadeGun || 0)

        const minPrice = Math.min(...prices)
        const minDelivery = Math.min(...deliveryTimes)
        const maxVade = Math.max(...vades)

        return currentOffers.map((t: any) => {
            // Fiyat Skoru (Düşük fiyat yüksek puan)
            const priceScore = minPrice > 0 ? (minPrice / Number(t.toplamTutar)) * 100 : 0
            // Teslimat Skoru (Kısa süre yüksek puan)
            const deliveryScore = minDelivery > 0 ? (minDelivery / t.teslimSuresi) * 100 : 0
            // Vade Skoru (Uzun vade yüksek puan)
            const vadeScore = maxVade > 0 ? (t.vadeGun / maxVade) * 100 : 0
            // Performans Skoru
            const perfScore = 100

            const totalScore = (
                (priceScore * (rfq.agirlikFiyat ?? 100) / 100) +
                (vadeScore * (rfq.agirlikVade ?? 0) / 100) +
                (deliveryScore * (rfq.agirlikTeslimat ?? 0) / 100) +
                (perfScore * (rfq.agirlikPerformans ?? 0) / 100)
            )

            // Gerekçe oluştur
            const reasons = []
            if (Number(t.toplamTutar) === minPrice) reasons.push("En düşük fiyat")
            if (t.teslimSuresi === minDelivery) reasons.push("En kısa teslimat")
            if (t.vadeGun === maxVade && maxVade > 0) reasons.push("En uzun vade")

            let reasonText = "Dengeli en iyi teklif"
            if (reasons.length > 0) {
                reasonText = reasons.join(" ve ") + " avantajıyla öne çıkmaktadır."
            } else {
                reasonText = "Genel kriter puanlamasına göre en uygun seçenektir."
            }

            return { teklifId: t.id, score: totalScore, reason: reasonText }
        }).sort((a: any, b: any) => b.score - a.score)
    }

    const scores = calculateScores()
    const bestOfferId = scores.length > 0 ? scores[0].teklifId : null

    return (
        <div className="flex flex-col gap-8 animate-in fade-in duration-500">
            {/* Header / Breadcrumb Area with Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm hover:shadow-md"
                    >
                        <span className="text-xl">←</span>
                    </button>
                    <div>
                        <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded-md">İhale Yönetimi</span>
                            <span className="text-slate-300">/</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{rfq.rfqNo}</span>
                        </div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            {rfq.baslik}
                            <span className={`premium-badge ${durumRenk(rfq.durum)}`}>
                                {rfq.durum}
                            </span>
                        </h1>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <RfqPdfButton rfq={rfq} scores={scores} />

                    {rfq.durum === 'TASLAK' && (
                        <button
                            onClick={handleSendRFQ}
                            disabled={sending}
                            className="premium-button-primary shadow-blue-500/20"
                        >
                            {sending ? 'Gönderiliyor...' : '🚀 İhaleyi Başlat'}
                        </button>
                    )}

                    {(rfq.durum === 'GONDERILDI' || rfq.durum === 'DEGERLENDIRILME') && (
                        <button
                            onClick={handleEarlyClose}
                            disabled={isClosing}
                            className="premium-button-danger shadow-rose-500/10"
                        >
                            {isClosing ? 'Kapatılıyor...' : '🛑 İhaleyi Kapat'}
                        </button>
                    )}

                    {(rfq.durum === 'DEGERLENDIRILME' || rfq.durum === 'GONDERILDI') && (rfq.mevcutTur || 1) < (rfq.maksimumTur || 3) && (
                        <button
                            onClick={() => setShowNewRoundModal(true)}
                            className="premium-button-secondary bg-blue-50 border-blue-100 text-blue-600 hover:bg-blue-100 shadow-sm"
                        >
                            🔄 Yeni Tur Başlat
                        </button>
                    )}
                </div>

            </div>

            {/* Premium Info Bar (Stats) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Süreç Durumu', value: `Tur ${rfq.mevcutTur || 1} / ${rfq.maksimumTur || 1}`, icon: '⏱️', color: 'blue', subtext: rfq.turDurumu === 'AKTIF' ? 'TUR AKTİF' : 'BEKLEMEDE' },
                    { label: 'Kategori', value: rfq.kategori?.ad || 'Genel', icon: '📁', color: 'indigo', subtext: 'İHALE GRUBU' },
                    { label: 'Katılım', value: `${rfq.tedarikciler?.length || 0} Tedarikçi`, icon: '🏢', color: 'sky', subtext: 'DAVET EDİLEN' },
                    { label: 'Teklifler', value: `${rfq.teklifler?.length || 0} Yanıt`, icon: '💰', color: 'emerald', subtext: 'GÜNCEL TEKLİF' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-center gap-4 group">
                        <div className={`w-12 h-12 rounded-2xl bg-${stat.color}-50 flex items-center justify-center text-xl group-hover:scale-110 transition-transform`}>{stat.icon}</div>
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                            <p className="text-[14px] font-black text-slate-800 tracking-tight">{stat.value}</p>
                            <p className={`text-[8px] font-bold uppercase mt-0.5 ${stat.subtext === 'TUR AKTİF' ? 'text-emerald-500 animate-pulse' : 'text-slate-400'}`}>{stat.subtext}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Navigation Tabs (Modern Pill Style) */}
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-100/50 p-2 rounded-[24px] w-fit border border-slate-200/40 shadow-inner">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
                            flex items-center gap-2 px-8 py-3.5 rounded-[18px] text-[11px] font-black uppercase tracking-widest transition-all
                            ${activeTab === tab.id
                                ? 'bg-white text-blue-600 shadow-lg ring-1 ring-blue-500/5 scale-[1.02]'
                                : 'text-slate-400 hover:text-slate-600 hover:bg-white/40'}
                        `}
                    >
                        <span className="text-sm">{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content Area */}
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/40 p-4 md:p-8 min-h-[400px]">

                {/* GENEL TAB */}
                {
                    activeTab === 'genel' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {/* Sol Kolon: Temel Bilgiler */}
                            <div className="space-y-6">
                                <div>
                                    <label className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Oluşturan</label>
                                    <p className="text-sm font-bold text-slate-700 mt-1">{rfq.olusturan?.ad || 'Sistem'}</p>
                                </div>
                                <div>
                                    <label className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Bitiş Tarihi</label>
                                    <p className="text-sm font-bold text-slate-700 mt-1">{new Date(rfq.bitisTarihi).toLocaleString('tr-TR')}</p>
                                </div>
                            </div>

                            {/* Sağ Kolon: Açıklama */}
                            <div className="md:col-span-2 lg:col-span-2 space-y-6">
                                {rfq.aciklama && (
                                    <div>
                                        <label className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Açıklama</label>
                                        <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 mt-1">
                                            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{rfq.aciklama}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Alt Kısım: Doküman Hatırlatıcı */}
                            <div className="md:col-span-2 lg:col-span-3 mt-4 p-5 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 border border-blue-100/50 rounded-[28px] flex items-center justify-between shadow-sm">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-2xl">📎</div>
                                    <div>
                                        <p className="text-xs font-black text-slate-800 uppercase tracking-widest">Şartname ve Dokümanlar</p>
                                        <p className="text-[10px] text-slate-500 uppercase font-bold mt-0.5">Bu ihaleye ait tüm belgeleri dokümanlar sekmesinden yönetebilirsiniz.</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setActiveTab('dokumanlar')}
                                    className="text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest bg-white px-4 py-2 rounded-xl shadow-sm border border-blue-50 transition-all hover:-translate-x-1"
                                >
                                    Görüntüle →
                                </button>
                            </div>
                        </div>
                    )
                }

                {/* KALEMLER TAB */}
                {
                    activeTab === 'kalemler' && (
                        <div>
                            <div className="overflow-hidden rounded-2xl border border-slate-100 shadow-sm">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-100">
                                            <th className="text-left px-6 py-4 text-slate-400 font-black uppercase tracking-widest">Talep Bilgisi</th>
                                            <th className="text-left px-6 py-4 text-slate-400 font-black uppercase tracking-widest">Kalem / Açıklama</th>
                                            <th className="text-right px-6 py-4 text-slate-400 font-black uppercase tracking-widest">Miktar</th>
                                            <th className="text-center px-6 py-4 text-slate-400 font-black uppercase tracking-widest">Birim</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {rfq.kalemler.map((k: any) => (
                                            <React.Fragment key={k.id}>
                                                <tr className="hover:bg-blue-50/30 transition-colors">
                                                    <td className="px-6 py-4 font-mono font-bold text-blue-600">{k.talep.barkod}</td>
                                                    <td className="px-6 py-4">
                                                        <div className="font-bold text-slate-800">{k.talepKalem.aciklama}</div>
                                                        {k.talepKalem.detay && <div className="text-[10px] text-slate-400 mt-0.5 italic">{k.talepKalem.detay}</div>}
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-black text-slate-700 bg-slate-50/30">{k.miktar || k.talepKalem.miktar}</td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-lg font-bold uppercase tracking-tight">{k.talepKalem.birim}</span>
                                                    </td>
                                                </tr>
                                            </React.Fragment>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )
                }

                {
                    activeTab === 'tedarikciler' && (
                        <div className="space-y-8">
                            {/* Mevcut Tedarikçiler */}
                            <div>
                                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Eklenen Tedarikçiler
                                </h3>
                                {rfq.tedarikciler.length === 0 ? (
                                    <div className="bg-slate-50 rounded-2xl p-8 text-center border-2 border-dashed border-slate-200">
                                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Henüz tedarikçi eklenmedi.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {rfq.tedarikciler.map((t: any) => (
                                            <div key={t.id} className="premium-card group p-5 flex flex-col justify-between">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-lg">
                                                        {t.tedarikci.ad.charAt(0)}
                                                    </div>
                                                    <span className={`premium-badge ${t.durum === 'YANITLADI' ? 'badge-emerald' :
                                                        t.durum === 'BEKLIYOR' ? 'badge-amber' :
                                                            'badge-slate'
                                                        }`}>
                                                        {t.durum}
                                                    </span>
                                                </div>
                                                <div className="space-y-0.5">
                                                    <h4 className="font-black text-slate-800 text-sm uppercase tracking-tight truncate">{t.tedarikci.ad}</h4>
                                                    <p className="text-[10px] text-slate-400 font-bold truncate">{t.tedarikci.email}</p>
                                                </div>
                                                {t.gonderimTarihi && (
                                                    <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                                                        <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider">Gönderim Tarihi</span>
                                                        <span className="text-[10px] text-slate-700 font-black">{new Date(t.gonderimTarihi).toLocaleDateString('tr-TR')}</span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Tedarikçi Ekle (Havuzdan) */}
                            {rfq.durum === 'TASLAK' && rfq.kategoriId && (
                                <div className="border-t border-slate-100 pt-6">
                                    <h3 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-widest">Tedarikçi Seç (Havuzdan)</h3>
                                    {loadingTedarikci ? (
                                        <p className="text-slate-400 text-xs">Tedarikçiler yükleniyor...</p>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-4 gap-3">
                                                {availableTedarikcieler
                                                    .filter(t => !rfq.tedarikciler.find((rt: any) => rt.tedarikciId === t.id))
                                                    .map(t => (
                                                        <label key={t.id} className="flex items-center gap-3 p-3 border border-slate-100 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors group">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedTedarikciIds.includes(t.id)}
                                                                onChange={(e) => {
                                                                    if (e.target.checked) {
                                                                        setSelectedTedarikciIds([...selectedTedarikciIds, t.id])
                                                                    } else {
                                                                        setSelectedTedarikciIds(selectedTedarikciIds.filter(id => id !== t.id))
                                                                    }
                                                                }}
                                                                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                            />
                                                            <span className="text-xs text-slate-700 font-medium group-hover:text-indigo-600 transition-colors">{t.ad}</span>
                                                        </label>
                                                    ))}
                                            </div>
                                            {selectedTedarikciIds.length > 0 && (
                                                <button
                                                    onClick={handleAddTedarikcieler}
                                                    className="bg-slate-800 text-white px-6 py-2 rounded-lg text-xs font-bold uppercase hover:bg-slate-900 transition-all shadow-lg hover:shadow-slate-200"
                                                >
                                                    {selectedTedarikciIds.length} Seçili Tedarikçiyi Ekle
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Harici Davet */}
                            <div className="border-t border-slate-100 pt-6 mt-4">
                                <h3 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-widest flex items-center gap-2">
                                    <span className="p-1.5 bg-indigo-50 rounded-lg">📧</span> Harici Tedarikçi Davet Et
                                </h3>
                                <form onSubmit={handleExternalInvite} className="flex gap-3 max-w-md">
                                    <input
                                        type="email"
                                        placeholder="Tedarikçi e-posta adresi..."
                                        className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50/50 transition-all"
                                        value={externalEmail}
                                        onChange={(e) => setExternalEmail(e.target.value)}
                                        required
                                    />
                                    <button
                                        type="submit"
                                        disabled={isInviting}
                                        className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-xs font-bold uppercase hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-100 hover:shadow-indigo-200 flex items-center gap-2"
                                    >
                                        {isInviting ? (
                                            <>
                                                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                Bekleyiniz
                                            </>
                                        ) : 'Davet Gönder'}
                                    </button>
                                </form>
                                <p className="text-[10px] text-slate-400 mt-3 uppercase tracking-wider leading-relaxed">
                                    Sistemde kayıtlı olmayan bir tedarikçiye direkt mail ile teklif linki gönderilir.<br />
                                    Tedarikçi onaylandığında sisteme otomatik olarak "Misafir" statüsünde kaydedilir.
                                </p>
                            </div>
                        </div>
                    )
                }

                {/* TEKLİFLER TAB */}
                {
                    activeTab === 'teklifler' && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                            {rfq.teklifler.length === 0 ? (
                                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center">
                                    <div className="text-5xl mb-4">📭</div>
                                    <h3 className="text-lg font-bold text-slate-800 mb-1">Henüz Teklif Alınmadı</h3>
                                    <p className="text-slate-500 text-sm">Tedarikçiler tekliflerini gönderdiklerinde burada karşılaştırmalı olarak görünecektir.</p>
                                </div>
                            ) : (
                                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                                    <div className="p-6 border-b border-slate-100 bg-slate-50/30 flex justify-between items-center">
                                        <h3 className="text-sm font-black text-slate-800 flex items-center gap-3">
                                            <span className="w-8 h-8 rounded-xl bg-white shadow-sm flex items-center justify-center">📊</span>
                                            TEKLİF KARŞILAŞTIRMA MATRİSİ
                                        </h3>
                                        <div className="flex gap-4 items-center">
                                            {(rfq.durum === 'GONDERILDI' || rfq.durum === 'DEGERLENDIRILME') && (
                                                <button
                                                    onClick={() => setShowManualOfferModal(true)}
                                                    className="premium-button-secondary py-2 px-4 shadow-sm"
                                                >
                                                    <span>➕</span> Harici Teklif Gir
                                                </button>
                                            )}
                                            <div className="h-6 w-px bg-slate-200"></div>
                                            <div className="flex gap-4 text-[10px] font-black uppercase tracking-tighter">
                                                <span className="flex items-center gap-1.5 text-slate-400">
                                                    <span className="w-2.5 h-2.5 bg-blue-500 border border-blue-600 rounded-md shadow-sm"></span> 1. EN UCUZ
                                                </span>
                                                <span className="flex items-center gap-1.5 text-slate-400">
                                                    <span className="w-2.5 h-2.5 bg-blue-300 border border-blue-400 rounded-md shadow-sm"></span> 2. EN UCUZ
                                                </span>
                                                <span className="flex items-center gap-1.5 text-slate-400">
                                                    <span className="w-2.5 h-2.5 bg-blue-100 border border-blue-200 rounded-md shadow-sm"></span> 3. EN UCUZ
                                                </span>
                                            </div>
                                            <div className="h-6 w-px bg-slate-200"></div>
                                            <label className="flex items-center gap-3 cursor-pointer select-none group">
                                                <span className="text-[10px] font-black text-slate-400 group-hover:text-blue-600 transition-colors uppercase tracking-widest">Sadece En İyi 5</span>
                                                <div className="relative inline-flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        className="sr-only peer"
                                                        checked={showOnlyTop5}
                                                        onChange={(e) => setShowOnlyTop5(e.target.checked)}
                                                    />
                                                    <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600 shadow-inner"></div>
                                                </div>
                                            </label>
                                        </div>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full text-xs border-collapse">
                                            <thead>
                                                <tr className="bg-slate-50/80">
                                                    <th className="sticky left-0 z-10 bg-slate-50 border-b border-r border-slate-100 p-4 text-left font-bold text-slate-600 min-w-[200px]">
                                                        KALEMLER
                                                    </th>
                                                    {rfq.teklifler
                                                        .sort((a: any, b: any) => {
                                                            if (b.turNo !== a.turNo) return b.turNo - a.turNo;
                                                            return a.toplamTutar - b.toplamTutar;
                                                        })
                                                        .filter((_: any, idx: number) => !showOnlyTop5 || idx < 5)
                                                        .map((t: any, idx: number) => {
                                                            const isLatestRound = t.turNo === rfq.mevcutTur;
                                                            return (
                                                                <th key={t.id} className={`border-b border-slate-100 p-4 text-center min-w-[180px] ${!isLatestRound ? 'opacity-60 bg-slate-50/30' : ''}`}>
                                                                    <div className="flex flex-col items-center gap-1">
                                                                        <span className="font-bold text-slate-800 uppercase tracking-tight">
                                                                            {t.hariciTedarikciAdi || t.tedarikci?.ad || 'Bilinmeyen Tedarikçi'}
                                                                        </span>

                                                                        {/* EKLENEN DOSYALAR */}
                                                                        {t.attachments && t.attachments.length > 0 && (
                                                                            <div className="flex flex-wrap justify-center gap-1 mb-1">
                                                                                {t.attachments.map((file: any) => (
                                                                                    <a
                                                                                        key={file.id}
                                                                                        href={`/uploads/${file.url}`}
                                                                                        target="_blank"
                                                                                        rel="noopener noreferrer"
                                                                                        className="group/file relative"
                                                                                        title={file.name}
                                                                                    >
                                                                                        <span className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200 flex items-center gap-1 transition-colors">
                                                                                            📄 <span className="max-w-[60px] truncate">{file.name}</span>
                                                                                        </span>
                                                                                    </a>
                                                                                ))}
                                                                            </div>
                                                                        )}

                                                                        <div className="flex flex-wrap justify-center gap-1">
                                                                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold border ${t.turNo === rfq.mevcutTur
                                                                                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                                                                : 'bg-slate-200 text-slate-600 border-slate-300'
                                                                                }`}>
                                                                                {t.turNo}. TUR
                                                                            </span>
                                                                            {t.turNo === rfq.mevcutTur && (
                                                                                <span className="bg-emerald-100 text-emerald-700 text-[9px] px-1.5 py-0.5 rounded-full font-black">
                                                                                    GÜNCEL
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        {idx === 0 && t.turNo === rfq.mevcutTur && (
                                                                            <span className="text-[9px] text-emerald-600 font-black mt-0.5">
                                                                                💰 EN DÜŞÜK FİYAT
                                                                            </span>
                                                                        )}
                                                                        {bestOfferId === t.id && (
                                                                            <div className="mt-2 flex flex-col items-center animate-bounce">
                                                                                <span className="bg-indigo-600 text-white text-[9px] px-2 py-1 rounded-full font-black shadow-lg">
                                                                                    ✨ SİSTEM TAVSİYESİ
                                                                                </span>
                                                                                <p className="text-[9px] text-indigo-600 font-bold mt-1.5 max-w-[150px] leading-tight text-center">
                                                                                    {scores.find((s: any) => s.teklifId === t.id)?.reason}
                                                                                </p>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </th>
                                                            );
                                                        })}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {/* Kalem Satırları */}
                                                {rfq.kalemler.map((k: any) => (
                                                    <tr key={k.id} className="group hover:bg-slate-50/50 transition-colors">
                                                        <td className="sticky left-0 z-10 bg-white group-hover:bg-slate-50 border-b border-r border-slate-100 p-4">
                                                            <div className="font-medium text-slate-800">{k.talepKalem.aciklama}</div>
                                                            <div className="text-[10px] text-slate-400 mt-0.5">{k.miktar} {k.talepKalem.birim}</div>
                                                        </td>
                                                        {rfq.teklifler
                                                            .sort((a: any, b: any) => {
                                                                if (b.turNo !== a.turNo) return b.turNo - a.turNo;
                                                                return a.toplamTutar - b.toplamTutar;
                                                            })
                                                            .filter((_: any, idx: number) => !showOnlyTop5 || idx < 5)
                                                            .map((t: any) => {
                                                                const kalemTeklif = t.kalemler.find((tk: any) => tk.talepKalem.id === k.talepKalemId);
                                                                const isSelected = k.siparisSecimi?.teklifId === t.id;
                                                                const isLatestRound = t.turNo === rfq.mevcutTur;

                                                                // Heatmap Hesabı (Aynı turdaki tüm teklifleri al)
                                                                const roundOffers = rfq.teklifler
                                                                    .filter((ot: any) => ot.turNo === t.turNo)
                                                                    .map((ot: any) => ot.kalemler.find((otk: any) => otk.talepKalem.id === k.talepKalemId))
                                                                    .filter((tk: any) => !!tk)
                                                                    .sort((a: any, b: any) => Number(a.birimFiyat) - Number(b.birimFiyat));

                                                                const rank = kalemTeklif ? roundOffers.findIndex((ro: any) => ro.birimFiyat === kalemTeklif.birimFiyat) : -1;

                                                                let heatmapClass = '';
                                                                if (rank === 0) heatmapClass = 'bg-blue-500/20';
                                                                else if (rank === 1) heatmapClass = 'bg-blue-300/20';
                                                                else if (rank === 2) heatmapClass = 'bg-blue-100/20';

                                                                return (
                                                                    <td
                                                                        key={t.id}
                                                                        className={`border-b border-slate-100 p-6 text-center transition-all cursor-pointer relative
                                                                        ${isSelected ? 'bg-blue-50/40 ring-1 ring-inset ring-blue-500/20 z-10 scale-[1.02] shadow-sm' : heatmapClass}
                                                                        ${!isLatestRound ? 'opacity-40 grayscale-[0.8]' : ''}
                                                                    `}
                                                                        onClick={() => handleSelectKalemTedarikci(k.id, t.id)}
                                                                    >
                                                                        {kalemTeklif ? (
                                                                            <div className="flex flex-col items-center gap-2">
                                                                                <div className="flex items-baseline gap-1">
                                                                                    <span className={`text-sm font-bold 
                                                                                    ${rank === 0 && isLatestRound ? 'text-emerald-700' :
                                                                                            rank === 1 && isLatestRound ? 'text-lime-700' :
                                                                                                rank === 2 && isLatestRound ? 'text-amber-700' :
                                                                                                    'text-slate-800'}`}>
                                                                                        {Number(kalemTeklif.birimFiyat).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                                                                    </span>
                                                                                    <span className="text-[10px] text-slate-400">{t.paraBirimi}</span>
                                                                                </div>
                                                                                {rank >= 0 && rank <= 2 && isLatestRound && (
                                                                                    <div className={`absolute top-1 right-1 w-2 h-2 rounded-full 
                                                                                    ${rank === 0 ? 'bg-blue-500' : rank === 1 ? 'bg-blue-300' : 'bg-blue-100'}`}></div>
                                                                                )}
                                                                                <button
                                                                                    disabled={!isLatestRound}
                                                                                    className={`w-full py-2 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest
                                                                                    ${isSelected
                                                                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 scale-105'
                                                                                            : isLatestRound
                                                                                                ? 'bg-white border border-slate-200 text-slate-400 hover:border-blue-500 hover:text-blue-600 hover:shadow-md'
                                                                                                : 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed opacity-50'}`}
                                                                                >
                                                                                    {isSelected ? '✓ SEÇİLDİ' : isLatestRound ? 'SEÇ' : 'ESKİ TUR'}
                                                                                </button>
                                                                            </div>
                                                                        ) : (
                                                                            <span className="text-slate-300 italic text-[10px]">Teklif Yok</span>
                                                                        )}
                                                                    </td>
                                                                );
                                                            })}
                                                    </tr>
                                                ))}

                                                {/* Ara Ayraç */}
                                                <tr className="bg-slate-100/50">
                                                    <td className="sticky left-0 z-10 bg-slate-100/50 border-y border-r border-slate-200 p-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                                        ÖZET BİLGİLER
                                                    </td>
                                                    {rfq.teklifler
                                                        .sort((a: any, b: any) => {
                                                            if (b.turNo !== a.turNo) return b.turNo - a.turNo;
                                                            return a.toplamTutar - b.toplamTutar;
                                                        })
                                                        .filter((_: any, idx: number) => !showOnlyTop5 || idx < 5)
                                                        .map((t: any) => (
                                                            <td key={t.id} className="border-y border-slate-200"></td>
                                                        ))}
                                                </tr>

                                                {/* Toplam Tutar */}
                                                <tr>
                                                    <td className="sticky left-0 z-10 bg-white border-b border-r border-slate-100 p-4 font-bold text-slate-600">
                                                        TOPLAM TUTAR
                                                    </td>
                                                    {rfq.teklifler
                                                        .sort((a: any, b: any) => {
                                                            if (b.turNo !== a.turNo) return b.turNo - a.turNo;
                                                            return a.toplamTutar - b.toplamTutar;
                                                        })
                                                        .filter((_: any, idx: number) => !showOnlyTop5 || idx < 5)
                                                        .map((t: any) => {
                                                            const isLatestRound = t.turNo === rfq.mevcutTur;
                                                            return (
                                                                <td key={t.id} className={`border-b border-slate-100 p-4 text-center ${!isLatestRound ? 'opacity-60' : ''}`}>
                                                                    <span className={`text-base font-black ${isLatestRound ? 'text-slate-900' : 'text-slate-500'}`}>
                                                                        {Number(t.toplamTutar).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                                                    </span>
                                                                    <span className="ml-1 text-xs text-slate-500 font-bold">{t.paraBirimi}</span>
                                                                </td>
                                                            );
                                                        })}
                                                </tr>

                                                {/* Teslimat */}
                                                <tr>
                                                    <td className="sticky left-0 z-10 bg-white border-b border-r border-slate-100 p-4 font-bold text-slate-600">
                                                        TESLİMAT SÜRESİ
                                                    </td>
                                                    {rfq.teklifler
                                                        .sort((a: any, b: any) => {
                                                            if (b.turNo !== a.turNo) return b.turNo - a.turNo;
                                                            return a.toplamTutar - b.toplamTutar;
                                                        })
                                                        .filter((_: any, idx: number) => !showOnlyTop5 || idx < 5)
                                                        .map((t: any) => {
                                                            const isLatestRound = t.turNo === rfq.mevcutTur;
                                                            return (
                                                                <td key={t.id} className={`border-b border-slate-100 p-4 text-center ${!isLatestRound ? 'opacity-60' : ''}`}>
                                                                    <span className={`${isLatestRound ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-500'} px-3 py-1 rounded-full font-bold text-[10px]`}>
                                                                        {t.teslimSuresi} GÜN
                                                                    </span>
                                                                </td>
                                                            );
                                                        })}
                                                </tr>

                                                {/* Ödeme Planı */}
                                                <tr>
                                                    <td className="sticky left-0 z-10 bg-white border-b border-r border-slate-100 p-4 font-bold text-slate-600">
                                                        ÖDEME PLANI
                                                    </td>
                                                    {rfq.teklifler
                                                        .sort((a: any, b: any) => {
                                                            if (b.turNo !== a.turNo) return b.turNo - a.turNo;
                                                            return a.toplamTutar - b.toplamTutar;
                                                        })
                                                        .filter((_: any, idx: number) => !showOnlyTop5 || idx < 5)
                                                        .map((t: any) => {
                                                            const isLatestRound = t.turNo === rfq.mevcutTur;
                                                            return (
                                                                <td key={t.id} className={`border-b border-slate-100 p-4 text-center ${!isLatestRound ? 'opacity-60' : ''}`}>
                                                                    <div className="flex flex-col gap-1 items-center">
                                                                        {t.odemePlani && t.odemePlani.length > 0 ? (
                                                                            t.odemePlani.map((p: any, pIdx: number) => (
                                                                                <span key={pIdx} className={`text-[9px] px-2 py-0.5 rounded border font-medium ${isLatestRound ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-slate-50 text-slate-500 border-slate-100'
                                                                                    }`}>
                                                                                    %{p.oran} {p.vadeGun === 0 ? 'PEŞİN' : `${p.vadeGun}G VADE`}
                                                                                </span>
                                                                            ))
                                                                        ) : (
                                                                            <span className="text-slate-400 italic text-[10px]">Belirtilmedi</span>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                            );
                                                        })}
                                                </tr>

                                                {/* Durum */}
                                                <tr>
                                                    <td className="sticky left-0 z-10 bg-white border-b border-r border-slate-100 p-4 font-bold text-slate-600 uppercase">
                                                        TEKLİF DURUMU
                                                    </td>
                                                    {rfq.teklifler
                                                        .sort((a: any, b: any) => {
                                                            if (b.turNo !== a.turNo) return b.turNo - a.turNo;
                                                            return a.toplamTutar - b.toplamTutar;
                                                        })
                                                        .filter((_: any, idx: number) => !showOnlyTop5 || idx < 5)
                                                        .map((t: any) => {
                                                            const isLatestRound = t.turNo === rfq.mevcutTur;
                                                            return (
                                                                <td key={t.id} className={`border-b border-slate-100 p-4 text-center ${!isLatestRound ? 'opacity-60' : ''}`}>
                                                                    <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase shadow-sm
                                                                    ${t.durum === 'KABUL' ? 'bg-emerald-500 text-white' :
                                                                            t.durum === 'RED' ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
                                                                        {t.durum}
                                                                    </span>
                                                                </td>
                                                            );
                                                        })}
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                {/* SİPARİŞ TAB */}
                {activeTab === 'siparis' && (
                    <div className="bg-white rounded-[32px] border border-slate-100 p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {rfq.siparisler && rfq.siparisler.length > 0 ? (
                            <div>
                                <h3 className="text-sm font-bold text-slate-700 mb-3">Oluşturulan Siparişler</h3>
                                <div className="space-y-2">
                                    {rfq.siparisler.map((s: any) => (
                                        <div key={s.id} className="border border-slate-100 rounded-lg p-3 flex justify-between items-center">
                                            <div>
                                                <span className="font-mono font-bold text-slate-700">{s.barkod}</span>
                                                <span className="ml-2 text-xs text-slate-400">{s.aciklama}</span>
                                            </div>
                                            <a href={`/siparisler?id=${s.id}`} className="text-indigo-600 text-xs font-bold uppercase hover:underline">
                                                Görüntüle →
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Seçim Özeti Tablosu */}
                                <div className="border border-slate-200 rounded-lg overflow-hidden">
                                    <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                                        <h4 className="font-bold text-slate-700 text-sm">Sipariş Oluşturulacak Kalemler</h4>
                                        <span className="text-xs text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded">
                                            {rfq.kalemler.filter((k: any) => k.siparisSecimi).length} kalem seçildi
                                        </span>
                                    </div>
                                    <table className="w-full text-xs">
                                        <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                                            <tr>
                                                <th className="p-3 text-left">Kalem</th>
                                                <th className="p-3 text-left">Seçilen Tedarikçi</th>
                                                <th className="p-3 text-right">Miktar</th>
                                                <th className="p-3 text-right">Birim Fiyat</th>
                                                <th className="p-3 text-right">Toplam</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {rfq.kalemler.filter((k: any) => k.siparisSecimi).map((k: any) => {
                                                const teklif = k.siparisSecimi.teklif
                                                const kalemTeklif = teklif.kalemler.find((tk: any) => tk.talepKalem.id === k.talepKalemId)
                                                const miktar = k.miktar || k.talepKalem.miktar
                                                const tutar = kalemTeklif ? kalemTeklif.birimFiyat * miktar : 0

                                                return (
                                                    <tr key={k.id} className="hover:bg-slate-50">
                                                        <td className="p-3 font-medium text-slate-700">{k.talepKalem.aciklama}</td>
                                                        <td className="p-3">
                                                            <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-bold border border-emerald-100">
                                                                {teklif.tedarikci.ad}
                                                            </span>
                                                        </td>
                                                        <td className="p-3 text-right text-slate-600">{miktar} {k.talepKalem.birim}</td>
                                                        <td className="p-3 text-right text-slate-600">{kalemTeklif?.birimFiyat.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {teklif.paraBirimi}</td>
                                                        <td className="p-3 text-right font-bold text-slate-800">{tutar.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {teklif.paraBirimi}</td>
                                                    </tr>
                                                )
                                            })}
                                            {rfq.kalemler.filter((k: any) => k.siparisSecimi).length === 0 && (
                                                <tr><td colSpan={5} className="p-8 text-center text-slate-400 italic">Henüz tedarikçi seçimi yapılmadı. Lütfen 'Teklifler' sekmesinden seçim yapınız.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Form ve Sözleşme Alanı */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                                    {/* Sipariş Formu */}
                                    <div className="bg-slate-50 p-5 rounded-lg border border-slate-200">
                                        <h4 className="font-bold text-slate-700 text-sm mb-4 flex items-center gap-2">
                                            <span>📝</span> Sipariş Detayları
                                        </h4>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="text-[10px] text-slate-500 uppercase font-bold">Sipariş Barkodu *</label>
                                                <input
                                                    type="text"
                                                    className="w-full mt-1 bg-white border border-slate-200 p-2 rounded text-xs outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-300 font-mono"
                                                    placeholder="Örn: PO-2024-001"
                                                    value={siparisForm.barkod}
                                                    onChange={(e) => setSiparisForm({ ...siparisForm, barkod: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] text-slate-500 uppercase font-bold">Birim *</label>
                                                <select
                                                    className="w-full mt-1 bg-white border border-slate-200 p-2 rounded text-xs outline-none focus:border-indigo-500 transition-colors"
                                                    value={siparisForm.birimId}
                                                    onChange={(e) => setSiparisForm({ ...siparisForm, birimId: e.target.value })}
                                                >
                                                    <option value="">Seçiniz...</option>
                                                    {birimler.map(b => <option key={b.id} value={b.id}>{b.ad}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-[10px] text-slate-500 uppercase font-bold">Yönetmelik *</label>
                                                <select
                                                    className="w-full mt-1 bg-white border border-slate-200 p-2 rounded text-xs outline-none focus:border-indigo-500 transition-colors"
                                                    value={siparisForm.yonetmelikId}
                                                    onChange={(e) => setSiparisForm({ ...siparisForm, yonetmelikId: e.target.value })}
                                                >
                                                    <option value="">Seçiniz...</option>
                                                    {yonetmelikler.map(y => <option key={y.id} value={y.id}>{y.madde}</option>)}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="text-[10px] text-slate-500 uppercase font-bold">Değerlendirme Modeli</label>
                                                <select
                                                    className="w-full mt-1 bg-white border border-slate-200 p-2 rounded text-xs outline-none focus:border-indigo-500 transition-colors"
                                                    value={siparisForm.degerlendirmeFormTipiId}
                                                    onChange={(e) => setSiparisForm({ ...siparisForm, degerlendirmeFormTipiId: e.target.value })}
                                                >
                                                    <option value="">Otomatik Seçim (Varsayılan)</option>
                                                    {formTipleri.map(f => <option key={f.id} value={f.id}>{f.ad}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-[10px] text-slate-500 uppercase font-bold">Alım Yöntemi *</label>
                                                <select
                                                    className="w-full mt-1 bg-white border border-slate-200 p-2 rounded text-xs outline-none focus:border-indigo-500 transition-colors"
                                                    value={siparisForm.alimYontemiId}
                                                    onChange={(e) => setSiparisForm({ ...siparisForm, alimYontemiId: e.target.value })}
                                                >
                                                    <option value="">Seçiniz...</option>
                                                    {alimYontemleri.map(a => <option key={a.id} value={a.id}>{a.ad}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Sözleşme Yükleme */}
                                    <div className="bg-slate-50 p-5 rounded-lg border border-slate-200 h-full">
                                        <h4 className="font-bold text-slate-700 text-sm mb-4 flex items-center gap-2">
                                            <span>📄</span> Sözleşme & Ekler
                                        </h4>
                                        <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center bg-white hover:bg-slate-50 transition-colors cursor-pointer group h-[calc(100%-2.5rem)] flex flex-col justify-center items-center">
                                            <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">📎</div>
                                            <p className="text-xs text-slate-600 font-bold">Dosya Seçin veya Sürükleyin</p>
                                            <p className="text-[10px] text-slate-400 mt-1">Sözleşme taslağı veya imzalı döküman (PDF, DOCX)</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end pt-8 border-t border-slate-100">
                                    <button
                                        onClick={handleCreateOrders}
                                        disabled={creatingOrder || rfq.kalemler.filter((k: any) => k.siparisSecimi).length === 0}
                                        className="premium-button-success shadow-emerald-500/20 px-10 py-4 text-xs"
                                    >
                                        {creatingOrder ? 'Oluşturuluyor...' : '🛒 Siparişleri Onayla ve Oluştur'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* DOKÜMANLAR TAB */}
                {activeTab === 'dokumanlar' && (
                    <div className="bg-white rounded-[32px] border border-slate-100 p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
                            <div>
                                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">📄</span>
                                    RFQ DOKÜMANLARI
                                </h3>
                                <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-wider">Teknik şartname, sözleşme taslakları ve diğer ekler</p>
                            </div>
                            <div className="w-full md:w-72">
                                <FileUpload
                                    relatedEntity="RFQ"
                                    entityId={rfq.id}
                                    onSuccess={() => setRefreshFiles(prev => prev + 1)}
                                    label="Yeni Doküman Ekle"
                                />
                            </div>
                        </div>
                        <div className="bg-slate-50/50 rounded-[24px] border border-slate-100 p-2">
                            <AttachmentList relatedEntity="RFQ" entityId={rfq.id} refreshTrigger={refreshFiles} />
                        </div>
                    </div>
                )}
            </div>

            {
                showNewRoundModal && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
                        <div className="bg-white rounded-[40px] shadow-2xl max-w-lg w-full overflow-hidden border border-white/20 scale-in-center">
                            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-blue-50/50 to-white">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-blue-600 shadow-lg shadow-blue-200 flex items-center justify-center text-white text-xl">🔄</div>
                                    <div>
                                        <h2 className="font-black text-slate-900 tracking-tight uppercase">Yeni Tur Başlat</h2>
                                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-0.5">Adım {roundStep + 1} / 2 • Planlama</p>
                                    </div>
                                </div>
                                <button onClick={() => { setShowNewRoundModal(false); setRoundStep(0); }} className="w-10 h-10 rounded-full bg-slate-50 text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all flex items-center justify-center font-bold text-xl">&times;</button>
                            </div>

                            <div className="p-10">
                                {roundStep === 0 ? (
                                    <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                                        <div className="flex items-center gap-4 mb-8">
                                            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-[20px] flex items-center justify-center text-2xl shadow-inner shadow-blue-100/50">📅</div>
                                            <div>
                                                <h3 className="text-lg font-black text-slate-800 tracking-tight">Kapanış Tarihi</h3>
                                                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">İhalenin hangi gün biteceğini seçin</p>
                                            </div>
                                        </div>
                                        <input
                                            type="date"
                                            value={newRoundDate ? newRoundDate.split('T')[0] : ''}
                                            onChange={(e) => {
                                                const date = e.target.value;
                                                const currentTime = newRoundDate ? newRoundDate.split('T')[1] : '17:00';
                                                setNewRoundDate(`${date}T${currentTime}`);
                                            }}
                                            min={new Date().toISOString().split('T')[0]}
                                            className="premium-input text-base"
                                        />
                                    </div>
                                ) : (
                                    <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                                        <div className="flex items-center gap-4 mb-8">
                                            <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-[20px] flex items-center justify-center text-2xl shadow-inner shadow-amber-100/50">🕒</div>
                                            <div>
                                                <h3 className="text-lg font-black text-slate-800 tracking-tight">Kapanış Saati</h3>
                                                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Teklifler saat kaçta kapansın?</p>
                                            </div>
                                        </div>
                                        <input
                                            type="time"
                                            value={newRoundDate ? newRoundDate.split('T')[1] : '17:00'}
                                            onChange={(e) => {
                                                const time = e.target.value;
                                                const currentDate = newRoundDate ? newRoundDate.split('T')[0] : new Date().toISOString().split('T')[0];
                                                setNewRoundDate(`${currentDate}T${time}`);
                                            }}
                                            className="premium-input text-base"
                                        />
                                        <div className="mt-8 p-5 bg-blue-50/50 rounded-[28px] border border-blue-100/50 flex items-center gap-4">
                                            <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-blue-50 flex items-center justify-center text-xl">ℹ️</div>
                                            <p className="text-[11px] text-blue-800 font-bold leading-relaxed">
                                                İhale <span className="text-blue-600 underline decoration-2 underline-offset-4">{new Date(newRoundDate).toLocaleDateString('tr-TR')}</span> tarihinde saat <span className="text-blue-600 underline decoration-2 underline-offset-4">{newRoundDate.split('T')[1]}</span> itibarıyla sona erecektir.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="p-8 border-t border-slate-50 flex items-center justify-between bg-slate-50/30">
                                <button
                                    onClick={() => roundStep === 0 ? setShowNewRoundModal(false) : setRoundStep(0)}
                                    className="px-6 py-3 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:text-slate-600 transition-colors"
                                >
                                    {roundStep === 0 ? 'İptal' : '← GERİ DÖN'}
                                </button>
                                <button
                                    onClick={() => roundStep === 0 ? setRoundStep(1) : handleStartNewRound()}
                                    disabled={startingRound || !newRoundDate || (roundStep === 0 && !newRoundDate.split('T')[0])}
                                    className="premium-button-primary px-8 py-3.5 shadow-blue-500/20"
                                >
                                    {roundStep === 0 ? 'Sonraki: Saat Seçimi' : (startingRound ? 'Başlatılıyor...' : '✅ TURU BAŞLAT')}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            <ManualOfferModal
                isOpen={showManualOfferModal}
                onClose={() => setShowManualOfferModal(false)}
                rfq={rfq}
                onSubmit={handleManualOfferSubmit}
            />
        </div >
    )
}
