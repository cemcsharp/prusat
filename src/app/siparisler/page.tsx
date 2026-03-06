'use client'

import { useState, useEffect, Suspense, useRef, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
    getSiparisler, getTalepler, getBirimler, getYonetmelikMaddeleri, getAlimYontemleri,
    getTedarikçiler, createSiparisFromTalep, deleteSiparis, createDegerlendirme,
    getDegerlendirmeFormTipleri, createDegerlendirmeFormu, updateSiparisDurum
} from '@/lib/actions'
import { ExportExcelButton, OrderPdfButton } from '@/components/ExportButtons'
import { useNotification } from '@/context/NotificationContext'
import { Pagination } from '@/components/Pagination'

function TedarikciCombobox({ tedarikciler, value, onChange }: { tedarikciler: any[], value: string, onChange: (val: string) => void }) {
    const [isOpen, setIsOpen] = useState(false)
    const [search, setSearch] = useState('')
    const containerRef = useRef<HTMLDivElement>(null)

    const filtered = tedarikciler.filter(t =>
        t.ad.toLowerCase().includes(search.toLowerCase()) ||
        (t.yetkiliKisi && t.yetkiliKisi.toLowerCase().includes(search.toLowerCase()))
    )

    const selectedTedarikci = tedarikciler.find(t => t.id.toString() === value)

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    return (
        <div ref={containerRef} className="relative">
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="bg-white border border-slate-200 rounded px-3 py-2 text-[12px] font-medium cursor-pointer flex justify-between items-center transition-all"
            >
                <span className={selectedTedarikci ? 'text-slate-800' : 'text-slate-400'}>
                    {selectedTedarikci ? selectedTedarikci.ad : 'Tedarikçi Seçimi (Opsiyonel)...'}
                </span>
                <span className="text-slate-300 text-[10px]">{isOpen ? '▲' : '▼'}</span>
            </div>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded shadow-lg max-h-60 overflow-hidden">
                    <div className="p-2 border-b border-slate-100">
                        <input
                            type="text"
                            placeholder="Tedarikçi ara..."
                            className="w-full px-2 py-1.5 text-[12px] border border-slate-200 rounded outline-none font-medium"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            autoFocus
                        />
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                        <div
                            onClick={() => { onChange(''); setIsOpen(false); setSearch(''); }}
                            className="px-3 py-2 text-[11px] text-slate-400 hover:bg-slate-50 cursor-pointer font-medium"
                        >
                            — Seçimi Kaldır —
                        </div>
                        {filtered.length === 0 ? (
                            <div className="px-3 py-4 text-[11px] text-slate-400 text-center font-medium">Sonuç bulunamadı</div>
                        ) : filtered.map(t => (
                            <div
                                key={t.id}
                                onClick={() => { onChange(t.id.toString()); setIsOpen(false); setSearch(''); }}
                                className={`px-3 py-2 text-[11px] cursor-pointer hover:bg-slate-50 flex justify-between items-center ${value === t.id.toString() ? 'bg-slate-100 text-slate-900' : 'text-slate-600 font-medium'}`}
                            >
                                <div>
                                    <div className="font-medium">{t.ad}</div>
                                    {t.yetkiliKisi && <div className="text-[10px] text-slate-400">{t.yetkiliKisi}</div>}
                                </div>
                                {t.ortalamaPuan > 0 && (
                                    <span className="text-[10px] text-slate-400 font-medium">Puan: {t.ortalamaPuan.toFixed(1)}</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

function SiparislerContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [siparisler, setSiparisler] = useState<any[]>([])
    const [talepler, setTalepler] = useState<any[]>([])
    const [birimler, setBirimler] = useState<any[]>([])
    const [yonetmelikler, setYonetmelikler] = useState<any[]>([])
    const [yontemler, setYontemler] = useState<any[]>([])
    const [tedarikciler, setTedarikciler] = useState<any[]>([])
    const { showAlert, showConfirm } = useNotification()

    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 20

    const [showModal, setShowModal] = useState(false)
    const [showDegerlendirmeModal, setShowDegerlendirmeModal] = useState(false)

    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('ALL')
    const [tedarikciFilter, setTedarikciFilter] = useState('ALL')

    const filteredSiparisler = useMemo(() => {
        return siparisler.filter(s => {
            const matchesSearch =
                s.barkod.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (s.aciklama && s.aciklama.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (s.tedarikci && s.tedarikci.ad.toLowerCase().includes(searchTerm.toLowerCase()))

            const matchesStatus = statusFilter === 'ALL' || s.durum === statusFilter
            const matchesTedarikci = tedarikciFilter === 'ALL' || s.tedarikciId?.toString() === tedarikciFilter

            return matchesSearch && matchesStatus && matchesTedarikci
        })
    }, [siparisler, searchTerm, statusFilter, tedarikciFilter])

    const paginatedSiparisler = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage
        return filteredSiparisler.slice(startIndex, startIndex + itemsPerPage)
    }, [filteredSiparisler, currentPage])

    const totalPages = Math.ceil(filteredSiparisler.length / itemsPerPage)

    const exportData = useMemo(() => {
        return filteredSiparisler.map(s => ({
            Tarih: new Date(s.tarih).toLocaleDateString('tr-TR'),
            Barkod: s.barkod,
            Konu: s.talep.konu,
            Tedarikci: s.tedarikci?.ad || 'Belirlenmemiş',
            Birim: s.birim.ad,
            Sorumlu: s.talep.sorumlu?.name || 'Atanmamış',
            Durum: s.durum
        }))
    }, [filteredSiparisler])
    const [formTipleri, setFormTipleri] = useState<any[]>([])
    const [selectedFormTipi, setSelectedFormTipi] = useState<any>(null)
    const [selectedSiparis, setSelectedSiparis] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    const [formData, setFormData] = useState({
        talepId: '',
        barkod: '',
        birimId: '',
        yonetmelikId: '',
        alimYontemiId: '',
        tedarikciId: '',
        aciklama: ''
    })

    useEffect(() => {
        fetchData()
    }, [])

    async function fetchData() {
        setLoading(true)
        try {
            const [sData, tData, bData, yData, yoData, teData, ftData] = await Promise.all([
                getSiparisler(),
                getTalepler(),
                getBirimler(),
                getYonetmelikMaddeleri(),
                getAlimYontemleri(),
                getTedarikçiler(),
                getDegerlendirmeFormTipleri()
            ])
            setSiparisler(sData)
            setTalepler(tData.filter((t: any) => t.durum !== 'SIPARISE_DONUSTU'))
            setBirimler(bData)
            setYonetmelikler(yData)
            setYontemler(yoData)
            setTedarikciler(teData)
            setFormTipleri(ftData || [])
        } catch (err) {
            console.error('Veri yükleme hatası:', err)
            showAlert('Veriler yüklenirken bir hata oluştu: ' + (err as Error).message, 'error')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        const talepId = searchParams.get('talepId')
        if (talepId) {
            router.push(`/siparisler/yeni?talepId=${talepId}`)
        }
    }, [searchParams, router])

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        try {
            await createSiparisFromTalep({
                talepId: parseInt(formData.talepId),
                barkod: formData.barkod,
                birimId: parseInt(formData.birimId),
                yonetmelikId: parseInt(formData.yonetmelikId),
                alimYontemiId: parseInt(formData.alimYontemiId),
                tedarikciId: formData.tedarikciId ? parseInt(formData.tedarikciId) : undefined,
                aciklama: formData.aciklama
            })
            setShowModal(false)
            setFormData({ talepId: '', barkod: '', birimId: '', yonetmelikId: '', alimYontemiId: '', tedarikciId: '', aciklama: '' })
            fetchData()
        } catch (err) {
            showAlert('Hata oluştu: ' + (err as Error).message, 'error')
        }
    }

    const handleTalepChange = (id: string) => {
        const selected = talepler.find(t => t.id === parseInt(id))
        setFormData({
            ...formData,
            talepId: id,
            barkod: selected ? `ORD-${selected.barkod}` : ''
        })
    }

    async function handleSiparisDelete(id: number) {
        const confirmed = await showConfirm('Bu siparişi silmek istediğinize emin misiniz?')
        if (confirmed) {
            try {
                await deleteSiparis(id)
                fetchData()
                showAlert('Sipariş başarıyla silindi', 'success')
            } catch (err) {
                showAlert('Hata: ' + (err as Error).message, 'error')
            }
        }
    }

    async function handleSiparisTamamla(sip: any) {
        const confirmed = await showConfirm('İşlemi "TAMAMLANDI" olarak işaretliyor musunuz?')
        if (confirmed) {
            try {
                await updateSiparisDurum(sip.id, 'TAMAMLANDI')
                await fetchData()
                showAlert('Sipariş tamamlandı', 'success')
                if (sip.tedarikciId) {
                    setSelectedSiparis(sip)
                    setShowDegerlendirmeModal(true)
                }
            } catch (err) {
                showAlert('Hata: ' + (err as Error).message, 'error')
            }
        }
    }

    const [proDegerlendirmeCevaplar, setProDegerlendirmeCevaplar] = useState<any[]>([])

    async function handleProDegerlendirmeSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!selectedSiparis?.tedarikciId || !selectedFormTipi) return
        try {
            await createDegerlendirmeFormu({
                tedarikciId: selectedSiparis.tedarikciId,
                formTipiId: selectedFormTipi.id,
                siparisId: selectedSiparis.id,
                degerlendiren: 'Sistem Yöneticisi',
                cevaplar: proDegerlendirmeCevaplar
            })
            setShowDegerlendirmeModal(false)
            setSelectedSiparis(null)
            setSelectedFormTipi(null)
            setProDegerlendirmeCevaplar([])
            fetchData()
        } catch (err) {
            showAlert('Hata: ' + (err as Error).message, 'error')
        }
    }

    const handleRatingChange = (soruId: number, puan: number) => {
        setProDegerlendirmeCevaplar(prev => {
            const exists = prev.find(c => c.soruId === soruId)
            if (exists) return prev.map(c => c.soruId === soruId ? { ...c, puan } : c)
            return [...prev, { soruId, puan, aciklama: '' }]
        })
    }

    const handleCommentChange = (soruId: number, aciklama: string) => {
        setProDegerlendirmeCevaplar(prev => {
            const exists = prev.find(c => c.soruId === soruId)
            if (exists) return prev.map(c => c.soruId === soruId ? { ...c, aciklama } : c)
            return [...prev, { soruId, puan: 5, aciklama }]
        })
    }

    const calculateLiveScore = () => {
        if (!selectedFormTipi) return 0
        let genelPuan = 0
        for (const grup of selectedFormTipi.gruplar) {
            const grupSoruIds = grup.sorular.map((s: any) => s.id)
            const grupCevaplar = proDegerlendirmeCevaplar.filter(c => grupSoruIds.includes(c.soruId))
            if (grupCevaplar.length > 0) {
                const grupOrtalama = grupCevaplar.reduce((acc, c) => acc + c.puan, 0) / grupCevaplar.length
                genelPuan += grupOrtalama * (grup.agirlik / 100)
            }
        }
        return Math.round(genelPuan * 100) / 100
    }

    const liveScore = calculateLiveScore()
    const getScoreResult = (puan: number) => {
        if (puan >= 4.50) return { label: 'A GRUBU (ONAYLI)', class: 'bg-emerald-50 text-emerald-600 border-emerald-100' }
        if (puan >= 3.50) return { label: 'B GRUBU (ÇALIŞABILIR)', class: 'bg-sky-50 text-sky-600 border-sky-100' }
        if (puan >= 2.50) return { label: 'C GRUBU (ŞARTLI)', class: 'bg-amber-50 text-amber-600 border-amber-100' }
        if (puan > 0) return { label: 'D GRUBU (YETERSIZ)', class: 'bg-rose-50 text-rose-600 border-rose-100' }
        return { label: 'BEKLIYOR', class: 'bg-slate-50 text-slate-400 border-slate-100' }
    }
    const scoreResult = getScoreResult(liveScore)

    return (
        <div className="flex flex-col gap-5 animate-in">
            {/* Header */}
            <div className="flex justify-between items-end border-b border-slate-200 pb-5">
                <div>
                    <h2 className="text-[15px] font-medium text-slate-800 uppercase tracking-widest">Sipariş Operasyon Yönetimi</h2>
                    <p className="text-[9px] text-slate-500 font-medium mt-0.5 uppercase tracking-tighter">Süreç Takip ve Tedarik Planlama</p>
                </div>
                <div className="flex gap-2">
                    <ExportExcelButton
                        data={exportData}
                        fileName="SiparisListesi"
                        sheetName="Siparisler"
                    />
                    <button
                        onClick={() => router.push('/siparisler/yeni')}
                        className="bg-slate-800 text-white px-4 py-1.5 rounded text-[11px] font-bold hover:bg-slate-900 transition-all shadow-md uppercase tracking-widest"
                    >
                        Yeni Sipariş Emri
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-wrap gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <div className="flex-1 min-w-[200px]">
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
                        <input
                            type="text"
                            placeholder="Sipariş No, Tedarikçi veya Açıklama ile ara..."
                            className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-2 rounded-lg text-[12px] outline-none focus:border-slate-400 focus:bg-white transition-all"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value)
                                setCurrentPage(1)
                            }}
                        />
                    </div>
                </div>
                <div className="w-40">
                    <select
                        className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-[12px] outline-none focus:border-slate-400"
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value)
                            setCurrentPage(1)
                        }}
                    >
                        <option value="ALL">Tüm Durumlar</option>
                        <option value="BEKLEMEDE">Beklemede</option>
                        <option value="ONAYLANDI">Onaylandı</option>
                        <option value="YOLDA">Yolda</option>
                        <option value="TAMAMLANDI">Tamamlandı</option>
                        <option value="IPTAL">İptal</option>
                    </select>
                </div>
                <div className="w-48">
                    <select
                        className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-[12px] outline-none focus:border-slate-400"
                        value={tedarikciFilter}
                        onChange={(e) => {
                            setTedarikciFilter(e.target.value)
                            setCurrentPage(1)
                        }}
                    >
                        <option value="ALL">Tüm Tedarikçiler</option>
                        {tedarikciler.map(t => (
                            <option key={t.id} value={t.id}>{t.ad}</option>
                        ))}
                    </select>
                </div>
                {(searchTerm || statusFilter !== 'ALL' || tedarikciFilter !== 'ALL') && (
                    <button
                        onClick={() => { setSearchTerm(''); setStatusFilter('ALL'); setTedarikciFilter('ALL'); }}
                        className="text-[10px] text-rose-500 font-bold uppercase hover:bg-rose-50 px-3 rounded-lg transition-all"
                    >
                        Temizle
                    </button>
                )}
            </div>

            {/* List Table */}
            <div className="premium-card overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                            <th className="px-5 py-4">Tarih</th>
                            <th className="px-5 py-4">Sipariş No</th>
                            <th className="px-5 py-4">Tedarikçi</th>
                            <th className="px-5 py-4">Ref. Talep</th>
                            <th className="px-5 py-4">Durum</th>
                            <th className="px-5 py-4">Birim / Mevzuat</th>
                            <th className="px-5 py-4 text-right">İşlemler</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan={7} className="px-5 py-10 text-center uppercase tracking-widest text-[10px] text-slate-500 font-medium">Veriler İşleniyor...</td></tr>
                        ) : paginatedSiparisler.length === 0 ? (
                            <tr><td colSpan={7} className="px-5 py-10 text-center text-slate-500 text-[10px] uppercase tracking-widest">Arama kriterlerine uygun kayıt bulunamadı.</td></tr>
                        ) : paginatedSiparisler.map((sip: any) => (
                            <tr key={sip.id} className="hover:bg-slate-50 transition-colors duration-150 group text-[12px] font-medium text-slate-600">
                                <td className="px-5 py-3">{new Date(sip.tarih).toLocaleDateString('tr-TR')}</td>
                                <td className="px-5 py-3 text-slate-800 uppercase tracking-tighter">{sip.barkod}</td>
                                <td className="px-5 py-3">
                                    <div className="flex flex-col">
                                        <span className="text-slate-700 uppercase">{sip.talep.konu}</span>
                                        <span className="text-[9px] text-slate-500 uppercase tracking-tighter">{sip.talep.barkod}</span>
                                    </div>
                                </td>
                                <td className="px-5 py-3">
                                    <div className="flex flex-col">
                                        <span className="text-slate-700 uppercase leading-none font-bold">{sip.talep.barkod}</span>
                                        <span className="text-[9px] text-slate-500 uppercase tracking-tighter mt-0.5">{sip.talep.konu.substring(0, 20)}...</span>
                                    </div>
                                </td>
                                <td className="px-5 py-3">
                                    <div className="flex flex-col text-[10px] gap-0.5">
                                        <span className="text-slate-600 font-medium">{sip.alimYontemi.ad}</span>
                                        <span className="text-slate-500 font-medium">{sip.birim.ad}</span>
                                    </div>
                                </td>
                                <td className="px-5 py-3">
                                    <span className={`px-2 py-0.5 rounded text-[9px] border uppercase tracking-tighter ${sip.durum === 'BEKLEMEDE' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                        sip.durum === 'TAMAMLANDI' ? 'bg-sky-50 text-sky-600 border-sky-100' :
                                            'bg-emerald-50 text-emerald-600 border-emerald-100'
                                        }`}>
                                        {sip.durum === 'BEKLEMEDE' ? 'BEKLEMEDE' :
                                            sip.durum === 'TAMAMLANDI' ? 'TAMAMLANDI' :
                                                'İNCELEMEDE'
                                        }
                                    </span>
                                </td>
                                <td className="px-5 py-3">
                                    {sip.degerlendirmeFormlari && sip.degerlendirmeFormlari.length > 0 ? (
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-[10px] font-medium text-slate-700 uppercase tracking-tighter">SKOR: {sip.degerlendirmeFormlari[0].genelPuan.toFixed(1)}</span>
                                            <span className={`text-[8px] font-medium px-1.5 py-0.5 rounded border uppercase tracking-tighter w-fit ${sip.degerlendirmeFormlari[0].sonuc === 'ONAYLI' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-100'
                                                }`}>
                                                {sip.degerlendirmeFormlari[0].sonuc}
                                            </span>
                                        </div>
                                    ) : sip.durum === 'TAMAMLANDI' ? (
                                        <span className="text-[9px] text-rose-600 font-bold uppercase tracking-widest text-[9px] animate-pulse">Değerlendirme Bekliyor!</span>
                                    ) : (
                                        <span className="text-[9px] text-slate-400 font-bold italic tracking-widest">SÜREÇTE</span>
                                    )}
                                </td>
                                <td className="px-5 py-3 text-right border-l border-slate-100 pl-4">
                                    <div className="flex justify-end gap-2 flex-wrap">
                                        <Link href={`/siparisler/${sip.id}`} className="text-[10px] font-bold text-slate-700 hover:text-slate-900 uppercase border-b border-slate-200 hover:border-slate-800 pb-0.5 px-1 hover:bg-slate-50 rounded transition-all">İncele</Link>
                                        {sip.durum === 'BEKLEMEDE' && (
                                            <button onClick={() => handleSiparisTamamla(sip)} className="text-[10px] font-bold text-emerald-600 uppercase border-b border-transparent hover:border-emerald-600 pb-0.5 px-1 hover:bg-emerald-50 rounded transition-all">Süreci Tamamla</button>
                                        )}
                                        {sip.tedarikciId && (
                                            <button onClick={() => { setSelectedSiparis(sip); setShowDegerlendirmeModal(true); }} className="text-[10px] font-bold text-slate-700 hover:text-slate-900 uppercase border-b border-slate-200 hover:border-slate-800 pb-0.5 px-1 hover:bg-slate-50 rounded transition-all">Performans</button>
                                        )}
                                        <a href={`/finans?siparisId=${sip.id}`} className="text-[10px] font-bold text-slate-700 hover:text-slate-900 uppercase border-b border-slate-200 hover:border-slate-800 pb-0.5 px-1 hover:bg-slate-50 rounded transition-all">Fatura</a>
                                        <button onClick={() => handleSiparisDelete(sip.id)} className="text-[10px] text-rose-600 font-bold uppercase border-b border-rose-200 hover:border-rose-600 pb-0.5 px-1 hover:bg-rose-50 rounded transition-all">Sil</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={filteredSiparisler.length}
                itemsPerPage={itemsPerPage}
            />

            {/* MODALS */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded w-full max-w-md shadow-xl border border-slate-200">
                        <div className="p-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center rounded-t text-[11px] font-medium text-slate-700 uppercase tracking-widest">
                            Sipariş Kayıt İşlemi
                            <button onClick={() => setShowModal(false)} className="text-slate-300 hover:text-slate-500 text-lg">×</button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-3">
                            <div className="flex flex-col gap-0.5">
                                <label className="text-[9px] font-medium text-slate-400 uppercase ml-1">İlgili Talep Ref</label>
                                <select required className="bg-white border border-slate-200 p-1.5 rounded text-[11px] font-medium outline-none focus:border-slate-400" value={formData.talepId} onChange={(e) => handleTalepChange(e.target.value)}>
                                    <option value="">Seçiniz...</option>
                                    {talepler.map(t => <option key={t.id} value={t.id}>{t.barkod} - {t.konu}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex flex-col gap-0.5">
                                    <label className="text-[9px] font-medium text-slate-400 uppercase ml-1">Sipariş Barkod</label>
                                    <input required type="text" className="bg-white border border-slate-200 p-1.5 rounded text-[11px] font-medium outline-none focus:border-slate-400" value={formData.barkod} onChange={(e) => setFormData({ ...formData, barkod: e.target.value })} />
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <label className="text-[9px] font-medium text-slate-400 uppercase ml-1">Talep Eden Birim</label>
                                    <select required className="bg-white border border-slate-200 p-1.5 rounded text-[11px] font-medium outline-none focus:border-slate-400" value={formData.birimId} onChange={(e) => setFormData({ ...formData, birimId: e.target.value })}>
                                        <option value="">Seçiniz...</option>
                                        {birimler.map(b => <option key={b.id} value={b.id}>{b.ad}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex flex-col gap-0.5">
                                    <label className="text-[9px] font-medium text-slate-400 uppercase ml-1">Yönetmelik Madde</label>
                                    <select required className="bg-white border border-slate-200 p-1.5 rounded text-[11px] font-medium outline-none focus:border-slate-400" value={formData.yonetmelikId} onChange={(e) => setFormData({ ...formData, yonetmelikId: e.target.value })}>
                                        <option value="">Seçiniz...</option>
                                        {yonetmelikler.map(y => <option key={y.id} value={y.id}>{y.madde}</option>)}
                                    </select>
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <label className="text-[9px] font-medium text-slate-400 uppercase ml-1">Alım Yöntemi</label>
                                    <select required className="bg-white border border-slate-200 p-1.5 rounded text-[11px] font-medium outline-none focus:border-slate-400" value={formData.alimYontemiId} onChange={(e) => setFormData({ ...formData, alimYontemiId: e.target.value })}>
                                        <option value="">Seçiniz...</option>
                                        {yontemler.map(yo => <option key={yo.id} value={yo.id}>{yo.ad}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <label className="text-[9px] font-medium text-slate-400 uppercase ml-1">Tedarikçi Firma</label>
                                <TedarikciCombobox tedarikciler={tedarikciler} value={formData.tedarikciId} onChange={(val) => setFormData({ ...formData, tedarikciId: val })} />
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <label className="text-[9px] font-medium text-slate-400 uppercase ml-1">Ek Açıklamalar</label>
                                <textarea rows={2} className="bg-white border border-slate-200 p-1.5 rounded text-[11px] font-medium outline-none focus:border-slate-400 resize-none" value={formData.aciklama} onChange={(e) => setFormData({ ...formData, aciklama: e.target.value })} />
                            </div>
                            <div className="flex justify-end gap-2 mt-2">
                                <button type="button" onClick={() => setShowModal(false)} className="px-3 py-1.5 text-[10px] font-medium text-slate-400 uppercase">İptal</button>
                                <button type="submit" className="bg-slate-700 text-white px-5 py-1.5 rounded text-[10px] font-medium hover:bg-slate-800 uppercase tracking-widest">Senkronize Et</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showDegerlendirmeModal && selectedSiparis && (
                <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded w-full max-w-2xl shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 sticky top-0 z-10">
                            <h3 className="text-[12px] font-medium text-slate-700 uppercase tracking-widest">Performans Değerlendirme Sistemi</h3>
                            <button onClick={() => { setShowDegerlendirmeModal(false); setSelectedFormTipi(null); }} className="text-slate-500 uppercase">×</button>
                        </div>

                        {!selectedFormTipi ? (
                            <div className="p-10 flex flex-col items-center gap-6">
                                <div className="text-center">
                                    <h4 className="text-[13px] font-medium text-slate-700 uppercase tracking-widest">Metrik Modeli Seçiniz</h4>
                                    <p className="text-[10px] text-slate-400 mt-1 uppercase">İşin niteliğine uygun değerlendirme kriter grubunu belirleyiniz.</p>
                                </div>
                                <div className="grid grid-cols-2 gap-3 w-full">
                                    {formTipleri.map(ft => (
                                        <button key={ft.id} onClick={() => setSelectedFormTipi(ft)} className="p-4 border border-slate-100 rounded bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300 transition-all text-left">
                                            <div className="text-[11px] font-medium text-slate-700 uppercase">{ft.ad}</div>
                                            <div className="text-[9px] text-slate-400 mt-1 uppercase tracking-tighter line-clamp-1">{ft.aciklama}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleProDegerlendirmeSubmit} className="p-5 flex flex-col gap-6">
                                <div className="flex justify-between items-center bg-slate-100/50 p-3 rounded border border-slate-100">
                                    <div className="text-[10px] font-medium text-slate-600 uppercase tracking-widest">AKTİF MODEL: {selectedFormTipi.ad}</div>
                                    <button type="button" onClick={() => { setSelectedFormTipi(null); setProDegerlendirmeCevaplar([]); }} className="text-[9px] text-slate-400 uppercase underline">Model Değiştir</button>
                                </div>

                                <div className="flex flex-col gap-8">
                                    {selectedFormTipi.gruplar?.map((grup: any) => (
                                        <div key={grup.id} className="flex flex-col gap-3">
                                            <div className="flex items-center gap-2 border-b border-slate-100 pb-1.5">
                                                <span className="bg-slate-300 text-white text-[9px] font-medium px-1 rounded">{grup.kod}</span>
                                                <h4 className="text-[11px] font-medium text-slate-700 uppercase">{grup.ad}</h4>
                                                <span className="text-[9px] text-slate-400 ml-auto italic">Ağırlık: %{grup.agirlik}</span>
                                            </div>
                                            <div className="flex flex-col gap-5 pl-3">
                                                {grup.sorular?.map((soru: any) => (
                                                    <div key={soru.id} className="flex flex-col gap-2">
                                                        <div className="flex justify-between items-start gap-4">
                                                            <div className="flex gap-2">
                                                                <span className="text-[10px] text-slate-300 font-medium">{soru.kod}</span>
                                                                <p className="text-[11px] font-medium text-slate-600">{soru.soru}</p>
                                                            </div>
                                                            <div className="flex gap-1">
                                                                {[1, 2, 3, 4, 5].map(star => (
                                                                    <button
                                                                        key={star}
                                                                        type="button"
                                                                        onClick={() => handleRatingChange(soru.id, star)}
                                                                        className={`w-6 h-6 rounded flex items-center justify-center transition-all ${(proDegerlendirmeCevaplar.find(c => c.soruId === soru.id)?.puan || 0) >= star
                                                                            ? 'bg-slate-700 text-white'
                                                                            : 'bg-slate-50 text-slate-300 hover:bg-slate-100'
                                                                            }`}
                                                                    >
                                                                        <span className="text-[10px] font-medium">{star}</span>
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <input
                                                            type="text"
                                                            placeholder="Opsiyonel gerekçe notu..."
                                                            className="text-[10px] bg-slate-50/50 border border-transparent focus:border-slate-200 p-1.5 rounded outline-none w-full"
                                                            value={proDegerlendirmeCevaplar.find(c => c.soruId === soru.id)?.aciklama || ''}
                                                            onChange={(e) => handleCommentChange(soru.id, e.target.value)}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="p-5 bg-slate-900 rounded border-l-4 border-slate-400 flex justify-between items-center text-white sticky bottom-0">
                                    <div className="flex items-center gap-4">
                                        <div className="flex flex-col items-center">
                                            <span className="text-[8px] opacity-40 uppercase">Metrik Skor</span>
                                            <span className="text-xl font-medium tracking-tight">{liveScore > 0 ? liveScore.toFixed(2) : '--'}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[8px] opacity-40 uppercase tracking-widest leading-none">Canlı Analiz Sonucu</span>
                                            <span className="text-[13px] font-medium uppercase tracking-tighter mt-0.5">{scoreResult.label}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button type="button" onClick={() => { setShowDegerlendirmeModal(false); setSelectedFormTipi(null); }} className="px-3 py-1.5 text-[10px] font-medium text-slate-400 uppercase">İptal</button>
                                        <button type="submit" disabled={liveScore === 0} className={`px-5 py-2 text-[10px] font-medium rounded uppercase transition-all ${liveScore > 0 ? 'bg-white text-slate-900 hover:bg-slate-100' : 'bg-slate-800 text-slate-600 cursor-not-allowed'}`}>Sisteme Arşivle</button>
                                    </div>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

export default function SiparislerPage() {
    return (
        <Suspense fallback={<div className="p-10 uppercase text-[10px] text-slate-400 font-medium tracking-widest">Satınalma Merkezi Başlatılıyor...</div>}>
            <SiparislerContent />
        </Suspense>
    )
}
