'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getPersoneller, getBirimler, createTalep, finalizeAttachments } from '@/lib/actions'
import { useNotification } from '@/context/NotificationContext'
import FileUpload from '@/components/FileUpload'
import AttachmentList from '@/components/AttachmentList'
import { useSession } from 'next-auth/react'
import { BIRIMLER } from '@/lib/constants'

export default function YeniTalepPage() {
    const { data: session } = useSession()
    const router = useRouter()
    const { showAlert } = useNotification()
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [personeller, setPersoneller] = useState<any[]>([])
    const [birimler, setBirimler] = useState<any[]>([])
    const [refreshFiles, setRefreshFiles] = useState(0)
    const [tempId, setTempId] = useState(0)
    useEffect(() => {
        setTempId(Math.floor(Math.random() * 1000000))
    }, [])

    const [formData, setFormData] = useState({
        ilgiliKisiId: '',
        birimId: '',
        bildirimEmail: '',
        barkod: '',
        konu: '',
        gerekce: ''
    })
    const [formKalemler, setFormKalemler] = useState<any[]>([{ aciklama: '', miktar: 1, birim: 'ADET' }])

    useEffect(() => {
        const personelId = session?.user?.personelId
        if (personelId) {
            setFormData(prev => ({ ...prev, ilgiliKisiId: personelId.toString() }))
        }
    }, [session])

    useEffect(() => {
        async function fetchData() {
            try {
                const [pData, bData] = await Promise.all([
                    getPersoneller(),
                    getBirimler()
                ])
                setPersoneller(pData)
                setBirimler(bData)
            } catch (err) {
                console.error(err)
                showAlert('Veriler yüklenirken hata oluştu', 'error')
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [showAlert])

    const addKalem = () => setFormKalemler([...formKalemler, { aciklama: '', miktar: 1, birim: 'ADET' }])
    const removeKalem = (index: number) => setFormKalemler(formKalemler.filter((_, i) => i !== index))
    const updateKalem = (index: number, field: string, value: any) => {
        const newKalemler = [...formKalemler]
        newKalemler[index] = { ...newKalemler[index], [field]: value }
        setFormKalemler(newKalemler)
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (submitting) return
        if (!formData.ilgiliKisiId) {
            showAlert('Oturum bilgisi alınamadı. Lütfen sayfayı yenileyin.', 'error')
            return
        }
        setSubmitting(true)
        try {
            const talep = await createTalep({
                ...formData,
                ilgiliKisiId: parseInt(formData.ilgiliKisiId),
                birimId: formData.birimId ? parseInt(formData.birimId) : undefined,
                bildirimEmail: formData.bildirimEmail || undefined,
                kalemler: formKalemler
            })

            await finalizeAttachments('TALEP_DRAFT', tempId, 'TALEP', talep.id)
            showAlert('Talep başarıyla oluşturuldu', 'success')
            router.push('/talepler')
        } catch (err) {
            showAlert('Hata oluştu: ' + (err as Error).message, 'error')
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
                <p className="text-slate-500 font-medium animate-pulse">Sistem Hazırlanıyor...</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-8 animate-in">
            {/* Page Header - Corporate Standard */}
            <div className="flex justify-between items-end border-b border-slate-200 pb-5">
                <div>
                    <h2 className="text-[15px] font-medium text-slate-800 uppercase tracking-widest">Yeni Satınalma Talebi</h2>
                    <p className="text-[9px] text-slate-500 font-medium mt-0.5 uppercase tracking-tighter">İhtiyaç Tanımlama ve Onay Süreci</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => router.back()}
                        className="bg-slate-50 text-slate-600 px-3 py-1.5 rounded text-[10px] font-medium border border-slate-200 hover:bg-slate-100 uppercase tracking-widest transition-all"
                    >
                        Listeye Dön
                    </button>
                    <button
                        form="talep-form"
                        type="submit"
                        disabled={submitting}
                        className="bg-slate-700 text-white px-4 py-1.5 rounded text-[10px] font-medium border border-slate-600 hover:bg-slate-800 uppercase tracking-widest transition-all shadow-lg active:scale-95 disabled:opacity-50"
                    >
                        {submitting ? 'İşleniyor...' : 'Kaydı Gönder'}
                    </button>
                </div>
            </div>

            <form id="talep-form" onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* SOL: KALEMLER VE DETAYLAR (2/3) */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    {/* Kalemler Kartı */}
                    <div className="premium-card overflow-hidden">
                        <div className="px-5 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="text-[11px] font-medium text-slate-700 uppercase tracking-widest">Talep Edilen Kalemler</h3>
                            <button
                                type="button"
                                onClick={addKalem}
                                className="text-[9px] text-indigo-600 font-bold hover:text-indigo-800 uppercase tracking-widest transition-colors"
                            >
                                + Yeni Satır Ekle
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="text-[9px] text-slate-600 uppercase tracking-widest font-medium border-b border-slate-100 bg-slate-50/30">
                                    <tr>
                                        <th className="px-5 py-3 w-12">No</th>
                                        <th className="px-5 py-3">Açıklama</th>
                                        <th className="px-5 py-3 w-24 text-center">Miktar</th>
                                        <th className="px-5 py-3 w-24 text-center">Birim</th>
                                        <th className="px-5 py-3 w-12 text-right"></th>
                                    </tr>
                                </thead>
                                <tbody className="">
                                    {formKalemler.map((kalem, idx) => (
                                        <React.Fragment key={idx}>
                                            <tr className="hover:bg-slate-50/30 transition-colors">
                                                <td className="px-5 py-3 text-[10px] font-bold text-slate-500">{(idx + 1).toString().padStart(2, '0')}</td>
                                                <td className="px-5 py-2">
                                                    <input
                                                        type="text"
                                                        required
                                                        className="w-full bg-transparent border-none p-0 text-[11px] focus:ring-0 placeholder:text-slate-400 font-medium text-slate-700"
                                                        placeholder="Malzeme veya hizmet açıklaması..."
                                                        value={kalem.aciklama}
                                                        onChange={(e) => updateKalem(idx, 'aciklama', e.target.value)}
                                                    />
                                                </td>
                                                <td className="px-5 py-2">
                                                    <input
                                                        type="number"
                                                        required
                                                        min="1"
                                                        className="w-full bg-transparent border-none p-0 text-[11px] text-center focus:ring-0 font-medium text-slate-700"
                                                        value={kalem.miktar}
                                                        onChange={(e) => updateKalem(idx, 'miktar', parseFloat(e.target.value) || 1)}
                                                    />
                                                </td>
                                                <td className="px-5 py-2">
                                                    <select
                                                        required
                                                        className="w-full bg-transparent border-none p-0 text-[11px] text-center focus:ring-0 uppercase font-bold text-slate-600 cursor-pointer"
                                                        value={kalem.birim}
                                                        onChange={(e) => updateKalem(idx, 'birim', e.target.value)}
                                                    >
                                                        {BIRIMLER.map(b => (
                                                            <option key={b} value={b}>{b}</option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td className="px-5 py-2 text-right">
                                                    {formKalemler.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => removeKalem(idx)}
                                                            className="text-slate-300 hover:text-rose-500 transition-colors"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                            <tr className="bg-slate-50/20 border-b border-slate-50 last:border-0">
                                                <td className="px-5 py-1"></td>
                                                <td colSpan={4} className="px-5 py-1.5 pb-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter shrink-0">TEKNİK DETAY:</span>
                                                        <input
                                                            type="text"
                                                            className="flex-1 bg-transparent border-none p-0 text-[10px] focus:ring-0 placeholder:text-slate-400 font-medium text-slate-600 italic"
                                                            placeholder="Marka, model, ölçü, teknik özellikler (İsteğe bağlı)..."
                                                            value={kalem.detay || ''}
                                                            onChange={(e) => updateKalem(idx, 'detay', e.target.value)}
                                                        />
                                                    </div>
                                                </td>
                                            </tr>
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Dökümanlar Kartı */}
                    <div className="premium-card p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <h3 className="text-[11px] font-medium text-slate-700 uppercase tracking-widest">Ekler & Teknik Bilgiler</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex flex-col gap-3">
                                <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded">
                                    <FileUpload
                                        relatedEntity="TALEP_DRAFT"
                                        entityId={tempId}
                                        onSuccess={() => setRefreshFiles(prev => prev + 1)}
                                        label="Döküman Seç"
                                    />
                                </div>
                                <p className="text-[9px] text-slate-400 leading-relaxed font-medium uppercase tracking-tighter">
                                    * Teknik çizim, şartname veya piyasa araştırması dökümanlarını ekleyiniz.
                                </p>
                            </div>
                            <div className="p-4 bg-slate-50 border border-slate-100 rounded min-h-[100px]">
                                <h4 className="text-[9px] font-medium text-slate-500 uppercase tracking-widest mb-3 border-b border-slate-200 pb-1.5">Yüklenen Dosyalar</h4>
                                <AttachmentList relatedEntity="TALEP_DRAFT" entityId={tempId} refreshTrigger={refreshFiles} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* SAĞ: ÖZET VE ANA BİLGİLER (1/3) */}
                <div className="flex flex-col gap-6">
                    <div className="premium-card p-5 border-t-2 border-t-slate-800">
                        <h3 className="text-[12px] font-medium text-slate-800 uppercase tracking-widest mb-5">Talep Üst Bilgileri</h3>

                        <div className="flex flex-col gap-5">
                            {/* Otomatik Personel */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-medium text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                    <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse"></div>
                                    Talebi Açan Personel
                                </label>
                                <div className="px-3 py-2 bg-slate-50 border border-slate-100 rounded text-[11px] font-medium text-slate-800 flex items-center gap-2 uppercase">
                                    <span className="opacity-40">👤</span>
                                    {session?.user?.name || 'Yükleniyor...'}
                                </div>
                            </div>

                            {/* Referans No */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">Barkod No / Proje Kodu</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="PR-2024-XXX"
                                    className="w-full bg-white border border-slate-200 px-3 py-2 rounded text-[11px] focus:ring-1 focus:ring-slate-400 outline-none uppercase font-medium placeholder:text-slate-300 transition-all font-mono"
                                    value={formData.barkod}
                                    onChange={(e) => setFormData({ ...formData, barkod: e.target.value })}
                                />
                            </div>

                            {/* Birim Seçimi */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">İlgili Birim</label>
                                <select
                                    required
                                    className="w-full bg-white border border-slate-200 px-3 py-2 rounded text-[11px] focus:ring-1 focus:ring-slate-400 outline-none uppercase font-medium cursor-pointer"
                                    value={formData.birimId}
                                    onChange={(e) => {
                                        const bId = e.target.value;
                                        const birim = birimler.find(b => b.id.toString() === bId);
                                        setFormData({
                                            ...formData,
                                            birimId: bId,
                                            bildirimEmail: birim?.email || formData.bildirimEmail
                                        });
                                    }}
                                >
                                    <option value="">Birim Seçiniz...</option>
                                    {birimler.map(b => <option key={b.id} value={b.id}>{b.ad.toUpperCase()}</option>)}
                                </select>
                            </div>

                            {/* Konu */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">Talep Başlığı</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="Kısa bir açıklama giriniz..."
                                    className="w-full bg-white border border-slate-200 px-3 py-2 rounded text-[11px] focus:ring-1 focus:ring-slate-400 outline-none font-medium text-slate-700 transition-all uppercase"
                                    value={formData.konu}
                                    onChange={(e) => setFormData({ ...formData, konu: e.target.value })}
                                />
                            </div>

                            {/* Detay/Gerekçe */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">Operasyonel Gerekçe</label>
                                <textarea
                                    required
                                    rows={4}
                                    placeholder="Bu ihtiyacın nedenini açıklayın..."
                                    className="w-full bg-white border border-slate-200 px-3 py-2 rounded text-[11px] focus:ring-1 focus:ring-slate-400 outline-none font-medium text-slate-700 transition-all resize-none"
                                    value={formData.gerekce}
                                    onChange={(e) => setFormData({ ...formData, gerekce: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Bilgilendirme */}
                    <div className="premium-card p-4 bg-slate-50/50 border-slate-100 italic">
                        <div className="flex gap-3">
                            <span className="text-[14px]">ℹ️</span>
                            <p className="text-[9px] text-slate-500 leading-normal font-medium uppercase tracking-tighter">
                                İşlem tamamlandığında <b>{formData.bildirimEmail || 'ilgili birime'}</b> otomatik bilgilendirme e-postası iletilecektir.
                            </p>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    )
}
