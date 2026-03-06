'use client'

import { useState, useEffect, Suspense, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
    getTalepler, getBirimler, getYonetmelikMaddeleri, getAlimYontemleri,
    getTedarikçiler, createSiparisFromTalep
} from '@/lib/actions'
import { useNotification } from '@/context/NotificationContext'
import { BIRIMLER } from '@/lib/constants'

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
                className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 cursor-pointer flex justify-between items-center transition-all focus:bg-white focus:border-indigo-400"
            >
                <span className={selectedTedarikci ? 'text-slate-800' : 'text-slate-400 font-normal'}>
                    {selectedTedarikci ? selectedTedarikci.ad : 'Tedarikçi Seçimi (Opsiyonel)...'}
                </span>
                <span className="text-slate-300 text-[10px]">{isOpen ? '▲' : '▼'}</span>
            </div>

            {isOpen && (
                <div className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl max-h-64 overflow-hidden animate-in fade-in slide-in-from-top-2">
                    <div className="p-3 border-b border-slate-50 bg-slate-50/50">
                        <input
                            type="text"
                            placeholder="Tedarikçi ara..."
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:border-indigo-300 transition-all shadow-sm"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            autoFocus
                        />
                    </div>
                    <div className="max-h-48 overflow-y-auto custom-scrollbar">
                        <div
                            onClick={() => { onChange(''); setIsOpen(false); setSearch(''); }}
                            className="px-4 py-3 text-xs text-rose-400 hover:bg-rose-50 cursor-pointer font-bold uppercase tracking-tighter"
                        >
                            — Seçimi Kaldır —
                        </div>
                        {filtered.length === 0 ? (
                            <div className="px-4 py-6 text-xs text-slate-400 text-center font-medium uppercase tracking-widest">Sonuç bulunamadı</div>
                        ) : filtered.map(t => (
                            <div
                                key={t.id}
                                onClick={() => { onChange(t.id.toString()); setIsOpen(false); setSearch(''); }}
                                className={`px-4 py-3 text-sm cursor-pointer hover:bg-indigo-50 border-b border-slate-50 last:border-0 flex justify-between items-center transition-colors ${value === t.id.toString() ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 font-medium'}`}
                            >
                                <div>
                                    <div className="font-bold uppercase tracking-tight">{t.ad}</div>
                                    {t.yetkiliKisi && <div className="text-[10px] text-slate-400 mt-0.5">{t.yetkiliKisi}</div>}
                                </div>
                                {t.ortalamaPuan > 0 && (
                                    <span className="text-[10px] bg-white px-2 py-0.5 rounded-full border border-slate-100 text-slate-500 font-black">⭐ {t.ortalamaPuan.toFixed(1)}</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

function YeniSiparisContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { showAlert } = useNotification()

    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [talepler, setTalepler] = useState<any[]>([])
    const [birimler, setBirimler] = useState<any[]>([])
    const [yonetmelikler, setYonetmelikler] = useState<any[]>([])
    const [yontemler, setYontemler] = useState<any[]>([])
    const [tedarikciler, setTedarikciler] = useState<any[]>([])

    const [formData, setFormData] = useState({
        talepId: searchParams.get('talepId') || '',
        barkod: '',
        birimId: '',
        yonetmelikId: '',
        alimYontemiId: '',
        tedarikciId: '',
        aciklama: ''
    })

    useEffect(() => {
        async function fetchData() {
            try {
                const [tData, bData, yData, yoData, teData] = await Promise.all([
                    getTalepler(),
                    getBirimler(),
                    getYonetmelikMaddeleri(),
                    getAlimYontemleri(),
                    getTedarikçiler()
                ])
                setTalepler(tData.filter((t: any) => t.durum === 'ONAYLANDI'))
                setBirimler(bData)
                setYonetmelikler(yData)
                setYontemler(yoData)
                setTedarikciler(teData)

                // URl'den talepId gelmişse form verilerini doldur
                const preselectedId = searchParams.get('talepId')
                if (preselectedId) {
                    const talep = tData.find((t: any) => t.id.toString() === preselectedId)
                    if (talep) {
                        setFormData(prev => ({
                            ...prev,
                            talepId: preselectedId,
                            barkod: talep.barkod,
                            birimId: talep.birimId?.toString() || '',
                            aciklama: talep.konu
                        }))
                    }
                }
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [searchParams])

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (submitting) return
        setSubmitting(true)
        try {
            await createSiparisFromTalep({
                ...formData,
                talepId: parseInt(formData.talepId),
                birimId: parseInt(formData.birimId),
                yonetmelikId: parseInt(formData.yonetmelikId),
                alimYontemiId: parseInt(formData.alimYontemiId),
                tedarikciId: formData.tedarikciId ? parseInt(formData.tedarikciId) : undefined
            })
            showAlert('Sipariş emri başarıyla oluşturuldu', 'success')
            router.push('/siparisler')
        } catch (err) {
            showAlert('Hata: ' + (err as Error).message, 'error')
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="w-10 h-10 border-4 border-slate-200 border-t-emerald-600 rounded-full animate-spin"></div>
                <p className="text-slate-500 font-medium animate-pulse">Sipariş Modülü Hazırlanıyor...</p>
            </div>
        )
    }

    const selectedTalep = talepler.find(t => t.id.toString() === formData.talepId)

    return (
        <div className="flex flex-col gap-8 animate-in">
            {/* Page Header - Corporate Standard */}
            <div className="flex justify-between items-end border-b border-slate-200 pb-5">
                <div>
                    <h2 className="text-[15px] font-medium text-slate-800 uppercase tracking-widest">Yeni Sipariş Emri</h2>
                    <p className="text-[9px] text-slate-500 font-medium mt-0.5 uppercase tracking-tighter">
                        {selectedTalep ? `${selectedTalep.barkod} Referanslı Talepten Kesinleştiriliyor` : 'Talep Bazlı Satınalma Operasyonu'}
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => router.back()}
                        className="bg-slate-50 text-slate-600 px-3 py-1.5 rounded text-[10px] font-medium border border-slate-200 hover:bg-slate-100 uppercase tracking-widest transition-all"
                    >
                        Listeye Dön
                    </button>
                    <button
                        form="siparis-form"
                        type="submit"
                        disabled={submitting || !formData.talepId || !formData.tedarikciId}
                        className="bg-slate-700 text-white px-4 py-1.5 rounded text-[10px] font-medium border border-slate-600 hover:bg-slate-800 uppercase tracking-widest transition-all shadow-lg active:scale-95 disabled:opacity-50"
                    >
                        {submitting ? 'İşleniyor...' : 'Siparişi Oluştur'}
                    </button>
                </div>
            </div>

            <form id="siparis-form" onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* SOL: KALEMLER VE PROSEDÜR (2/3) */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    {/* Kalem Listesi */}
                    <div className="premium-card overflow-hidden">
                        <div className="px-5 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="text-[11px] font-medium text-slate-700 uppercase tracking-widest">Sipariş Edilecek Kalemler</h3>
                            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                {selectedTalep?.kalemler?.length || 0} Kalem Bekliyor
                            </div>
                        </div>

                        <div className="overflow-x-auto min-h-[200px]">
                            {!selectedTalep ? (
                                <div className="py-20 text-center">
                                    <div className="text-2xl mb-2 opacity-20">📦</div>
                                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">Lütfen bir talep seçiniz</p>
                                </div>
                            ) : (
                                <table className="w-full text-left">
                                    <thead className="text-[9px] text-slate-500 uppercase tracking-widest font-medium border-b border-slate-50 bg-slate-50/20">
                                        <tr>
                                            <th className="px-5 py-3 w-12">No</th>
                                            <th className="px-5 py-3">Kalem Açıklaması</th>
                                            <th className="px-5 py-3 w-32 text-center">Miktar</th>
                                            <th className="px-5 py-3 w-24 text-center">Durum</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {selectedTalep.kalemler.map((kalem: any, idx: number) => (
                                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-5 py-3 text-[10px] font-medium text-slate-400">{(idx + 1).toString().padStart(2, '0')}</td>
                                                <td className="px-5 py-3">
                                                    <div className="text-[11px] font-medium text-slate-700 uppercase">{kalem.aciklama}</div>
                                                </td>
                                                <td className="px-5 py-3 text-center">
                                                    <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded border border-slate-200 uppercase">
                                                        {kalem.miktar} {kalem.birim}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3 text-center">
                                                    <span className="text-[8px] font-bold text-emerald-600 border border-emerald-100 bg-emerald-50 px-1.5 py-0.5 rounded uppercase tracking-tighter">Onaylı</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>

                    {/* Prosedür Detayları */}
                    <div className="premium-card p-5">
                        <h3 className="text-[11px] font-medium text-slate-700 uppercase tracking-widest mb-5 border-b border-slate-100 pb-3">Satınalma Mevzuatı ve Şartlar</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">Yönetmelik Maddesi *</label>
                                <select
                                    required
                                    className="w-full bg-white border border-slate-200 px-3 py-2 rounded text-[11px] focus:ring-1 focus:ring-slate-400 outline-none uppercase font-medium cursor-pointer"
                                    value={formData.yonetmelikId}
                                    onChange={(e) => setFormData({ ...formData, yonetmelikId: e.target.value })}
                                >
                                    <option value="">Seçiniz...</option>
                                    {yonetmelikler.map(y => <option key={y.id} value={y.id}>{y.madde.toUpperCase()}</option>)}
                                </select>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">Alım Yöntemi *</label>
                                <select
                                    required
                                    className="w-full bg-white border border-slate-200 px-3 py-2 rounded text-[11px] focus:ring-1 focus:ring-slate-400 outline-none uppercase font-medium cursor-pointer"
                                    value={formData.alimYontemiId}
                                    onChange={(e) => setFormData({ ...formData, alimYontemiId: e.target.value })}
                                >
                                    <option value="">Seçiniz...</option>
                                    {yontemler.map(a => <option key={a.id} value={a.id}>{a.ad.toUpperCase()}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">Sipariş Notları ve Lojistik Koşullar</label>
                            <textarea
                                rows={4}
                                placeholder="Tedarikçiye iletilecek notlar..."
                                className="w-full bg-slate-50 border border-slate-100 px-3 py-2 rounded text-[11px] focus:ring-1 focus:ring-slate-400 outline-none font-medium text-slate-700 transition-all resize-none"
                                value={formData.aciklama}
                                onChange={(e) => setFormData({ ...formData, aciklama: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                {/* SAĞ: ÖZET VE TEDARİKÇİ (1/3) */}
                <div className="flex flex-col gap-6">
                    <div className="premium-card p-5 border-t-2 border-t-slate-800">
                        <h3 className="text-[12px] font-medium text-slate-800 uppercase tracking-widest mb-5">Operasyon Özeti</h3>

                        <div className="flex flex-col gap-5">
                            {/* Talep Seçimi */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">İlişkili Talep *</label>
                                <select
                                    required
                                    className="w-full bg-white border border-slate-200 px-3 py-2 rounded text-[11px] focus:ring-1 focus:ring-slate-400 outline-none uppercase font-medium cursor-pointer"
                                    value={formData.talepId}
                                    onChange={(e) => {
                                        const tId = e.target.value;
                                        const talep = talepler.find(t => t.id.toString() === tId);
                                        setFormData({
                                            ...formData,
                                            talepId: tId,
                                            barkod: talep?.barkod || '',
                                            birimId: talep?.birimId?.toString() || '',
                                            aciklama: talep?.konu || ''
                                        });
                                    }}
                                >
                                    <option value="">Talebi Seçiniz...</option>
                                    {talepler.map(t => (
                                        <option key={t.id} value={t.id}>{t.barkod} | {t.konu.substring(0, 30).toUpperCase()}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Sipariş Barkod */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">Sipariş Referans / Barkod</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full bg-slate-800 border border-slate-700 px-3 py-2 rounded text-[11px] font-mono font-medium text-emerald-400 uppercase text-center tracking-widest outline-none"
                                    value={formData.barkod}
                                    placeholder="PO-2024-XXXX"
                                    onChange={(e) => setFormData({ ...formData, barkod: e.target.value })}
                                />
                            </div>

                            <hr className="border-slate-100" />

                            {/* Tedarikçi Seçimi */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">Tedarikçi Firma *</label>
                                <TedarikciCombobox
                                    tedarikciler={tedarikciler}
                                    value={formData.tedarikciId}
                                    onChange={(val) => setFormData({ ...formData, tedarikciId: val })}
                                />
                                {formData.tedarikciId && (
                                    <div className="mt-2 p-3 bg-emerald-50 border border-emerald-100 rounded flex items-center gap-3 animate-in zoom-in-95">
                                        <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-xs">🏢</div>
                                        <div className="flex flex-col">
                                            <span className="text-[8px] font-bold text-emerald-800 uppercase tracking-tighter">Seçili Firma</span>
                                            <span className="text-[10px] font-bold text-emerald-600 truncate max-w-[180px]">
                                                {tedarikciler.find(t => t.id.toString() === formData.tedarikciId)?.ad.toUpperCase()}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Sorumlu Birim - Auto */}
                            <div className="flex flex-col gap-1.5 opacity-50">
                                <label className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">Operasyonel Birim</label>
                                <div className="px-3 py-2 bg-slate-100 border border-slate-200 rounded text-[11px] font-medium text-slate-600 uppercase italic">
                                    {birimler.find(b => b.id.toString() === formData.birimId)?.ad || 'Otomatiktir'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bilgilendirme Kartı */}
                    <div className="premium-card p-4 bg-slate-800 text-slate-400 border-none shadow-xl">
                        <div className="flex gap-3">
                            <span className="text-lg opacity-80">⚡</span>
                            <div className="flex flex-col gap-0.5">
                                <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Sistem Otomasyonu</h4>
                                <p className="text-[9px] leading-relaxed font-medium">Bu işlem onaylandığında talep <b>"SİPARİŞE DÖNÜŞTÜ"</b> olarak işaretlenir.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    )
}

export default function YeniSiparisPage() {
    return (
        <Suspense fallback={<div>Yükleniyor...</div>}>
            <YeniSiparisContent />
        </Suspense>
    )
}
