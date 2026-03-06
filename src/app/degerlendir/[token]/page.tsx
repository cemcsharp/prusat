'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { getDegerlendirmeByToken, submitExternalDegerlendirme } from '@/lib/actions'

export default function DegerlendirmePage() {
    const params = useParams()
    const token = params.token as string
    const [siparis, setSiparis] = useState<any>(null)
    const [cevaplar, setCevaplar] = useState<any[]>([])
    const [submitting, setSubmitting] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await getDegerlendirmeByToken(token)
                if (data) {
                    setSiparis(data)
                    // Boş cevaplar oluştur
                    const initialCevaplar: any[] = []
                    data.degerlendirmeFormTipi?.gruplar?.forEach((g: any) => {
                        g.sorular?.forEach((s: any) => {

                            initialCevaplar.push({ soruId: s.id, puan: 0, aciklama: '' })
                        })
                    })
                    setCevaplar(initialCevaplar)
                } else {
                    setError('Geçersiz veya kullanılmış değerlendirme linki.')
                }
            } catch (err) {
                setError('Veriler yüklenirken bir hata oluştu.')
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [token])

    const handlePuanChange = (soruId: number, puan: number) => {
        setCevaplar(prev => prev.map(c => c.soruId === soruId ? { ...c, puan } : c))
    }

    const handleAciklamaChange = (soruId: number, aciklama: string) => {
        setCevaplar(prev => prev.map(c => c.soruId === soruId ? { ...c, aciklama } : c))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Tüm soruların cevaplandığını kontrol et
        const missing = cevaplar.find(c => c.puan === 0)
        if (missing) {
            alert('Lütfen tüm kriterleri puanlayınız.')
            return
        }

        setSubmitting(true)
        try {
            await submitExternalDegerlendirme(token, { cevaplar })
            setSuccess(true)
        } catch (err: any) {
            setError(err.message || 'Değerlendirme gönderilirken bir hata oluştu.')
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="text-slate-500 animate-pulse font-medium">Yükleniyor...</div>
        </div>
    )

    if (error) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl text-center border border-rose-100">
                <div className="text-rose-500 text-5xl mb-4 text-center">⚠️</div>
                <h1 className="text-xl font-bold text-slate-800 mb-2">Hata!</h1>
                <p className="text-slate-500 text-sm leading-relaxed">{error}</p>
                <div className="mt-8">
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">PRU - Satınalma Platformu Portalı</p>
                </div>
            </div>
        </div>
    )

    if (success) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl text-center border border-emerald-100">
                <div className="text-emerald-500 text-5xl mb-4">✅</div>
                <h1 className="text-xl font-bold text-slate-800 mb-2">Teşekkür Ederiz!</h1>
                <p className="text-slate-500 text-sm leading-relaxed">Değerlendirmeniz başarıyla kaydedilmiştir. Katkınız için teşekkür ederiz.</p>
                <div className="mt-8 pt-6 border-t border-slate-50">
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">İşlem Tamamlandı</p>
                </div>
            </div>
        </div>
    )

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 flex justify-center items-start">
            <div className="max-w-3xl w-full">
                {/* Header Card */}
                <div className="bg-white p-8 rounded-t-3xl shadow-sm border-b border-slate-100">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest mb-1">Tedarikçi Performans Değerlendirmesi</p>
                            <h1 className="text-2xl font-black text-slate-800 tracking-tight">{siparis.tedarikci.ad}</h1>
                        </div>
                        <div className="bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                            <span className="text-[10px] font-bold text-slate-500">{siparis.barkod}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                            <span className="text-[9px] text-slate-400 uppercase block mb-1">Talep Konusu</span>
                            <span className="text-sm font-semibold text-slate-700">{siparis.talep.konu}</span>
                        </div>
                        <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                            <span className="text-[9px] text-slate-400 uppercase block mb-1">Değerlendirme Modeli</span>
                            <span className="text-sm font-semibold text-slate-700">{siparis.degerlendirmeFormTipi.ad}</span>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 mt-6">
                    {siparis.degerlendirmeFormTipi.gruplar.map((grup: any) => (
                        <div key={grup.id} className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100 overflow-hidden">
                            <div className="flex items-center gap-3 mb-6">
                                <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">{grup.kod}</span>
                                <h2 className="text-lg font-bold text-slate-800">{grup.ad}</h2>
                            </div>

                            <div className="space-y-8">
                                {grup.sorular.map((soru: any) => (
                                    <div key={soru.id} className="group">
                                        <p className="text-sm font-bold text-slate-700 mb-4 group-hover:text-emerald-600 transition-colors">
                                            {soru.kod}. {soru.soru}
                                        </p>

                                        <div className="flex flex-wrap items-center gap-2 mb-4">
                                            {[1, 2, 3, 4, 5].map(p => {
                                                const currentAnswer = cevaplar.find(c => c.soruId === soru.id)
                                                const isActive = currentAnswer?.puan === p
                                                return (
                                                    <button
                                                        key={p}
                                                        type="button"
                                                        onClick={() => handlePuanChange(soru.id, p)}
                                                        className={`w-12 h-12 rounded-xl text-sm font-black transition-all flex items-center justify-center
                                                            ${isActive
                                                                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200 scale-110 ring-4 ring-emerald-50'
                                                                : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}
                                                    >
                                                        {p}
                                                    </button>
                                                )
                                            })}
                                            <span className="ml-4 text-[11px] font-bold text-slate-400 uppercase tracking-tighter">
                                                {cevaplar.find(c => c.soruId === soru.id)?.puan === 1 && 'Çok Kötü'}
                                                {cevaplar.find(c => c.soruId === soru.id)?.puan === 2 && 'Zayıf'}
                                                {cevaplar.find(c => c.soruId === soru.id)?.puan === 3 && 'Orta'}
                                                {cevaplar.find(c => c.soruId === soru.id)?.puan === 4 && 'İyi'}
                                                {cevaplar.find(c => c.soruId === soru.id)?.puan === 5 && 'Mükemmel'}
                                            </span>
                                        </div>

                                        <textarea
                                            placeholder="Detaylı görüşünüzü buraya yazabilirsiniz... (Opsiyonel)"
                                            className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-200 outline-none min-h-[80px]"
                                            value={cevaplar.find(c => c.soruId === soru.id)?.aciklama || ''}
                                            onChange={(e) => handleAciklamaChange(soru.id, e.target.value)}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    <div className="bg-emerald-600 p-1 rounded-2xl shadow-lg shadow-emerald-200">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full bg-white text-emerald-600 font-black uppercase tracking-widest text-sm py-5 rounded-xl hover:bg-emerald-50 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                        >
                            {submitting ? 'Gönderiliyor...' : (
                                <>
                                    <span>📋 Değerlendirmeyi Gönder</span>
                                    <span className="text-xl">🚀</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>

                <div className="mt-12 text-center text-slate-400 space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest">© {new Date().getFullYear()} PRU - Satınalma Platformu Kurumsal Sistemler</p>
                    <p className="text-[9px]">Geri bildiriminiz sürecin iyileştirilmesi için çok değerlidir.</p>
                </div>
            </div>
        </div>
    )
}
