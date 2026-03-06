'use client'

import { useState, useEffect, Suspense, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { getSozlesmeler, getSiparisler, createSozlesme, finalizeAttachments } from '@/lib/actions'
import { useNotification } from '@/context/NotificationContext'
import FileUpload from '@/components/FileUpload'
import AttachmentList from '@/components/AttachmentList'
import { Pagination } from '@/components/Pagination'

function SozlesmelerContent() {
    const searchParams = useSearchParams()
    const [sozlesmeler, setSozlesmeler] = useState<any[]>([])
    const [siparisler, setSiparisler] = useState<any[]>([])
    const [showModal, setShowModal] = useState(false)
    const [selectedSozlesme, setSelectedSozlesme] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const { showAlert } = useNotification()
    const [refreshFiles, setRefreshFiles] = useState(0)
    const [searchTerm, setSearchTerm] = useState('')
    const [tempId] = useState(() => Math.floor(Math.random() * 1000000))

    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 20

    const filteredSozlesmeler = useMemo(() => {
        return sozlesmeler.filter(sz => {
            return (
                sz.sozlesmeNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (sz.siparis?.tedarikci && sz.siparis.tedarikci.ad.toLowerCase().includes(searchTerm.toLowerCase()))
            )
        })
    }, [sozlesmeler, searchTerm])

    const paginatedSozlesmeler = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage
        return filteredSozlesmeler.slice(startIndex, startIndex + itemsPerPage)
    }, [filteredSozlesmeler, currentPage])

    const totalPages = Math.ceil(filteredSozlesmeler.length / itemsPerPage)

    const [formData, setFormData] = useState({
        siparisId: '',
        sozlesmeNo: '',
        baslangicTarihi: '',
        bitisTarihi: ''
    })

    useEffect(() => {
        fetchData()
    }, [])

    async function fetchData() {
        try {
            const [szData, sData] = await Promise.all([getSozlesmeler(), getSiparisler()])
            setSozlesmeler(szData)
            setSiparisler(sData)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    // URL'den siparisId gelirse otomatik modal açma
    useEffect(() => {
        const sipId = searchParams.get('siparisId')
        if (sipId && siparisler.length > 0) {
            setFormData(prev => ({ ...prev, siparisId: sipId }))
            setShowModal(true)
        }
    }, [searchParams, siparisler])

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        try {
            const sozlesme = await createSozlesme({
                siparisId: parseInt(formData.siparisId),
                sozlesmeNo: formData.sozlesmeNo,
                baslangicTarihi: new Date(formData.baslangicTarihi),
                bitisTarihi: new Date(formData.bitisTarihi)
            })

            // Dosyaları kesinleştir
            await finalizeAttachments('SOZLESME_DRAFT', tempId, 'SOZLESME', sozlesme.id)

            setShowModal(false)
            setFormData({ siparisId: '', sozlesmeNo: '', baslangicTarihi: '', bitisTarihi: '' })
            fetchData()
            showAlert('Sözleşme başarıyla kaydedildi', 'success')
        } catch (err) {
            showAlert('Hata: ' + (err as Error).message, 'error')
        }
    }

    return (
        <div className="flex flex-col gap-6 animate-in">
            {/* Page Header */}
            <div className="flex justify-between items-end border-b border-slate-200 pb-5">
                <div>
                    <h2 className="text-[15px] font-medium text-slate-800 uppercase tracking-widest">Sözleşme Takibi</h2>
                    <p className="text-[9px] text-slate-500 font-medium mt-0.5 uppercase tracking-tighter italic">Siparişlere bağlı sözleşmeleri ve bitiş tarihlerini yönetin.</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-slate-700 text-white px-4 py-1.5 rounded text-[10px] font-medium border border-slate-600 hover:bg-slate-800 uppercase tracking-widest transition-all shadow-lg active:scale-95"
                >
                    Yeni Sözleşme Kaydı
                </button>
            </div>

            {/* Filter Bar */}
            <div className="premium-card p-4 flex flex-wrap items-center gap-4 bg-slate-50/30">
                <div className="flex-1 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
                    <input
                        type="text"
                        placeholder="Sözleşme No veya Tedarikçi..."
                        className="w-full bg-white border border-slate-200 pl-9 pr-4 py-2 rounded text-[11px] font-medium outline-none focus:ring-1 focus:ring-slate-400 transition-all"
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value)
                            setCurrentPage(1)
                        }}
                    />
                </div>
                {(searchTerm) && (
                    <button
                        onClick={() => setSearchTerm('')}
                        className="text-[10px] text-rose-500 font-bold uppercase tracking-widest hover:underline"
                    >
                        Temizle
                    </button>
                )}
            </div>

            {/* Sözleşme Listesi Tablosu */}
            <div className="premium-card overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                            <th className="px-6 py-4">Sözleşme Ref</th>
                            <th className="px-6 py-4">Sipariş Ref</th>
                            <th className="px-6 py-4">Tedarikçi / Konu</th>
                            <th className="px-6 py-4">Başlangıç</th>
                            <th className="px-6 py-4">Bitiş</th>
                            <th className="px-6 py-4">Durum</th>
                            <th className="px-6 py-4 text-right">Aksiyonlar</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {loading ? (
                            <tr><td colSpan={7} className="px-6 py-20 text-center text-[10px] text-slate-400 font-medium uppercase tracking-[0.2em] animate-pulse">Veriler Çekiliyor...</td></tr>
                        ) : paginatedSozlesmeler.length === 0 ? (
                            <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-400 text-[10px] uppercase font-medium">Kayıt bulunamadı.</td></tr>
                        ) : paginatedSozlesmeler.map((sz: any) => {
                            const bitisDate = new Date(sz.bitisTarihi)
                            const isNear = bitisDate.getTime() - new Date().getTime() < 1000 * 60 * 60 * 24 * 30 // 30 gün
                            return (
                                <tr key={sz.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <span className="text-[11px] font-bold text-slate-700 uppercase">{sz.sozlesmeNo}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-[10px] font-bold text-indigo-600 uppercase">{sz.siparis.barkod}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-[10px] font-medium text-slate-600 uppercase truncate max-w-[200px] block">{sz.siparis.talep.konu}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-[10px] font-medium text-slate-500">{new Date(sz.baslangicTarihi).toLocaleDateString('tr-TR')}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`text-[10px] font-bold ${isNear ? 'text-rose-600' : 'text-slate-700'}`}>
                                            {bitisDate.toLocaleDateString('tr-TR')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold border tracking-tighter uppercase ${isNear ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                                            {isNear ? 'Kritik' : 'Aktif'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-1.5 justify-end transition-all">
                                            <Link href={`/sozlesmeler/${sz.id}`} className="p-1.5 rounded text-slate-400 hover:text-slate-600 transition-all" title="İncele">👁️</Link>
                                            <button className="p-1.5 rounded text-slate-400 hover:text-rose-500 transition-all" title="Sil">🗑️</button>
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            <div className="scale-90 origin-right pr-4">
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    totalItems={filteredSozlesmeler.length}
                    itemsPerPage={itemsPerPage}
                />
            </div>

            {/* SLIDE-OVER PANEL (CREATE) */}
            <div className={`fixed inset-0 z-50 overflow-hidden transition-all duration-300 ${showModal ? 'visible' : 'invisible'}`}>
                {/* Backdrop */}
                <div
                    className={`absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 ${showModal ? 'opacity-100' : 'opacity-0'}`}
                    onClick={() => setShowModal(false)}
                />

                {/* Panel Container */}
                <div className="absolute inset-y-0 right-0 max-w-full flex">
                    <div
                        className={`w-screen max-w-md transform transition-transform duration-300 ease-in-out ${showModal ? 'translate-x-0' : 'translate-x-full'} bg-white shadow-2xl flex flex-col`}
                    >
                        {/* Panel Header */}
                        <div className="bg-slate-800 text-white px-6 py-6 flex justify-between items-center">
                            <div>
                                <h2 className="text-sm font-bold uppercase tracking-widest">Yeni Sözleşme Kaydı</h2>
                                <p className="text-[9px] text-slate-400 font-medium uppercase tracking-tighter mt-0.5 italic">Eksiksiz Veri Girişi</p>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-white opacity-50 hover:opacity-100 transition-opacity"
                            >
                                <span className="text-2xl leading-none">×</span>
                            </button>
                        </div>

                        {/* Panel Body (Form) */}
                        <div className="flex-1 h-0 overflow-y-auto px-6 py-6">
                            <form onSubmit={handleSubmit} id="sozlesme-form" className="flex flex-col gap-6">
                                {/* Segment: Sipariş Bağlantısı */}
                                <div className="flex flex-col gap-4">
                                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Referans Bilgisi</h3>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">İlişkili Sipariş *</label>
                                        <select
                                            required
                                            className="w-full bg-white border border-slate-200 px-3 py-2 rounded text-[11px] font-bold text-slate-700 outline-none cursor-pointer uppercase"
                                            value={formData.siparisId}
                                            onChange={(e) => setFormData({ ...formData, siparisId: e.target.value })}
                                        >
                                            <option value="">Seçiniz...</option>
                                            {siparisler.map(s => <option key={s.id} value={s.id}>{s.barkod} | {s.talep.konu.substring(0, 30)}...</option>)}
                                        </select>
                                    </div>
                                </div>

                                {/* Segment: Sözleşme Detayları */}
                                <div className="flex flex-col gap-4">
                                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Hukuki Detaylar</h3>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">Sözleşme Referans No *</label>
                                        <input
                                            required
                                            type="text"
                                            placeholder="Örn: SZ-2024-001"
                                            className="w-full bg-white border border-slate-200 px-3 py-2 rounded text-[11px] font-bold text-slate-700 outline-none focus:ring-1 focus:ring-slate-400 transition-all uppercase tracking-widest text-center"
                                            value={formData.sozlesmeNo}
                                            onChange={(e) => setFormData({ ...formData, sozlesmeNo: e.target.value.toUpperCase() })}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">Başlangıç</label>
                                            <input
                                                required
                                                type="date"
                                                className="w-full bg-white border border-slate-200 px-3 py-2 rounded text-[11px] font-medium text-slate-700 outline-none transition-all"
                                                value={formData.baslangicTarihi}
                                                onChange={(e) => setFormData({ ...formData, baslangicTarihi: e.target.value })}
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">Bitiş</label>
                                            <input
                                                required
                                                type="date"
                                                className="w-full bg-white border border-slate-200 px-3 py-2 rounded text-[11px] font-medium text-slate-700 outline-none transition-all"
                                                value={formData.bitisTarihi}
                                                onChange={(e) => setFormData({ ...formData, bitisTarihi: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Segment: Dokümantasyon */}
                                <div className="flex flex-col gap-4">
                                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Dijital Arşiv</h3>
                                    <div className="bg-slate-50 p-6 rounded border-2 border-dashed border-slate-200 flex flex-col items-center">
                                        <div className="mb-4 w-full">
                                            <AttachmentList relatedEntity="SOZLESME_DRAFT" entityId={tempId} refreshTrigger={refreshFiles} />
                                        </div>
                                        <FileUpload
                                            relatedEntity="SOZLESME_DRAFT"
                                            entityId={tempId}
                                            onSuccess={() => setRefreshFiles(prev => prev + 1)}
                                            label="Sözleşme Taramasını Ekleyin"
                                        />
                                    </div>
                                </div>
                            </form>
                        </div>

                        {/* Panel Footer */}
                        <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-rose-500 transition-all"
                            >
                                Vazgeç
                            </button>
                            <button
                                type="submit"
                                form="sozlesme-form"
                                className="bg-slate-700 text-white px-6 py-2 rounded text-[10px] font-medium border border-slate-600 hover:bg-slate-800 uppercase tracking-widest transition-all shadow-lg active:scale-95"
                            >
                                Kaydı Kesinleştir
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* VIEW MODAL (INCELE) REMOVED */}
        </div>
    )
}

export default function SozlesmelerPage() {
    return (
        <Suspense fallback={<div>Yükleniyor...</div>}>
            <SozlesmelerContent />
        </Suspense>
    )
}
