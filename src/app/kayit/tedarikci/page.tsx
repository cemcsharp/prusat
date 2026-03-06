'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { registerTedarikci, checkDavetToken, getTedarikciKategorileri } from '@/lib/portalActions'

interface Kategori {
    id: number
    ad: string
}

function TedarikciKayitForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const davetToken = searchParams.get('token')

    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [kategoriler, setKategoriler] = useState<Kategori[]>([])
    const [davetBilgisi, setDavetBilgisi] = useState<{
        email?: string
        firmaAdi?: string
        kategoriler?: number[]
    } | null>(null)

    // Form state
    const [formData, setFormData] = useState({
        // Step 1: Firma
        firmaAdi: '',
        vergiNo: '',
        vergiDairesi: '',
        telefon: '',
        adres: '',
        // Step 2: Yetkili
        yetkiliAdi: '',
        yetkiliEmail: '',
        yetkiliTelefon: '',
        yetkiliUnvan: '',
        sifre: '',
        sifreTekrar: '',
        // Step 3: Kategoriler
        kategoriIds: [] as number[]
    })

    // Davet token kontrolü
    useEffect(() => {
        if (davetToken) {
            checkDavetToken(davetToken).then(result => {
                if (result.valid) {
                    setDavetBilgisi({
                        email: result.email,
                        firmaAdi: result.firmaAdi || undefined,
                        kategoriler: result.kategoriler || undefined
                    })
                    setFormData(prev => ({
                        ...prev,
                        yetkiliEmail: result.email || '',
                        firmaAdi: result.firmaAdi || '',
                        kategoriIds: result.kategoriler || []
                    }))
                } else {
                    setError(result.error || 'Geçersiz davet linki')
                }
            })
        }
    }, [davetToken])

    // Kategorileri yükle
    useEffect(() => {
        getTedarikciKategorileri().then(setKategoriler)
    }, [])

    const handleNext = () => {
        setError('')

        // Step 1 validasyonu
        if (step === 1) {
            if (!formData.firmaAdi || !formData.vergiNo || !formData.vergiDairesi || !formData.telefon) {
                setError('Lütfen zorunlu alanları doldurunuz.')
                return
            }
        }

        // Step 2 validasyonu
        if (step === 2) {
            if (!formData.yetkiliAdi || !formData.yetkiliEmail || !formData.sifre) {
                setError('Lütfen zorunlu alanları doldurunuz.')
                return
            }
            if (formData.sifre.length < 6) {
                setError('Şifre en az 6 karakter olmalıdır.')
                return
            }
            if (formData.sifre !== formData.sifreTekrar) {
                setError('Şifreler eşleşmiyor.')
                return
            }
        }

        setStep(step + 1)
    }

    const handleBack = () => {
        setStep(step - 1)
        setError('')
    }

    const handleSubmit = async () => {
        if (formData.kategoriIds.length === 0) {
            setError('En az bir kategori seçmelisiniz.')
            return
        }

        setLoading(true)
        setError('')

        const result = await registerTedarikci({
            ...formData,
            davetToken: davetToken || undefined
        })

        setLoading(false)

        if (result.success) {
            router.push(`/kayit/tedarikci/onay?auto=${result.autoApproved}`)
        } else {
            setError(result.error || 'Kayıt başarısız.')
        }
    }

    const toggleKategori = (id: number) => {
        setFormData(prev => ({
            ...prev,
            kategoriIds: prev.kategoriIds.includes(id)
                ? prev.kategoriIds.filter(k => k !== id)
                : [...prev.kategoriIds, id]
        }))
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-xl flex items-center justify-center">
                            <span className="text-white font-black text-xl">P</span>
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-white tracking-tight">PRU Tedarikçi Portalı</h1>
                            <p className="text-xs text-teal-300 font-medium uppercase tracking-widest">Kayıt Formu</p>
                        </div>
                    </div>

                    {davetBilgisi && (
                        <div className="bg-teal-900/30 border border-teal-500/30 rounded-lg px-4 py-2 inline-block">
                            <span className="text-teal-300 text-xs font-medium">✓ Davetli Kayıt - Otomatik Onay</span>
                        </div>
                    )}
                </div>

                {/* Progress Bar */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    {[1, 2, 3].map(s => (
                        <div key={s} className="flex items-center">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${step >= s
                                ? 'bg-gradient-to-br from-teal-400 to-emerald-500 text-white'
                                : 'bg-slate-700 text-slate-400'
                                }`}>
                                {s}
                            </div>
                            {s < 3 && (
                                <div className={`w-16 h-1 mx-2 rounded ${step > s ? 'bg-teal-500' : 'bg-slate-700'}`} />
                            )}
                        </div>
                    ))}
                </div>

                {/* Step Labels */}
                <div className="flex justify-between text-xs text-slate-400 font-medium uppercase tracking-wider mb-6 px-4">
                    <span className={step === 1 ? 'text-teal-400' : ''}>Firma Bilgileri</span>
                    <span className={step === 2 ? 'text-teal-400' : ''}>Yetkili Kişi</span>
                    <span className={step === 3 ? 'text-teal-400' : ''}>Kategoriler</span>
                </div>

                {/* Form Card */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
                    {error && (
                        <div className="bg-rose-500/20 border border-rose-500/30 text-rose-300 px-4 py-3 rounded-lg mb-6 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Step 1: Firma Bilgileri */}
                    {step === 1 && (
                        <div className="space-y-5">
                            <h2 className="text-lg font-bold text-white mb-6">Firma Bilgileri</h2>

                            <div>
                                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                                    Firma Unvanı *
                                </label>
                                <input
                                    type="text"
                                    value={formData.firmaAdi}
                                    onChange={e => setFormData({ ...formData, firmaAdi: e.target.value })}
                                    className="w-full bg-slate-800/50 border border-slate-600 text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                                    placeholder="ABC Elektrik Ltd. Şti."
                                    disabled={!!davetBilgisi?.firmaAdi}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                                        Vergi No *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.vergiNo}
                                        onChange={e => setFormData({ ...formData, vergiNo: e.target.value })}
                                        className="w-full bg-slate-800/50 border border-slate-600 text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                                        placeholder="1234567890"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                                        Vergi Dairesi *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.vergiDairesi}
                                        onChange={e => setFormData({ ...formData, vergiDairesi: e.target.value })}
                                        className="w-full bg-slate-800/50 border border-slate-600 text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                                        placeholder="Kadıköy"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                                    Telefon *
                                </label>
                                <input
                                    type="tel"
                                    value={formData.telefon}
                                    onChange={e => setFormData({ ...formData, telefon: e.target.value })}
                                    className="w-full bg-slate-800/50 border border-slate-600 text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                                    placeholder="0212 xxx xx xx"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                                    Adres
                                </label>
                                <textarea
                                    value={formData.adres}
                                    onChange={e => setFormData({ ...formData, adres: e.target.value })}
                                    rows={2}
                                    className="w-full bg-slate-800/50 border border-slate-600 text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all resize-none"
                                    placeholder="Firma adresi..."
                                />
                            </div>
                        </div>
                    )}

                    {/* Step 2: Yetkili Kişi */}
                    {step === 2 && (
                        <div className="space-y-5">
                            <h2 className="text-lg font-bold text-white mb-6">Yetkili Kişi Bilgileri</h2>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                                        Ad Soyad *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.yetkiliAdi}
                                        onChange={e => setFormData({ ...formData, yetkiliAdi: e.target.value })}
                                        className="w-full bg-slate-800/50 border border-slate-600 text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                                        placeholder="Ahmet Yılmaz"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                                        Unvan
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.yetkiliUnvan}
                                        onChange={e => setFormData({ ...formData, yetkiliUnvan: e.target.value })}
                                        className="w-full bg-slate-800/50 border border-slate-600 text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                                        placeholder="Satış Müdürü"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                                    E-posta *
                                </label>
                                <input
                                    type="email"
                                    value={formData.yetkiliEmail}
                                    onChange={e => setFormData({ ...formData, yetkiliEmail: e.target.value })}
                                    className="w-full bg-slate-800/50 border border-slate-600 text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                                    placeholder="yetkili@firma.com"
                                    disabled={!!davetBilgisi?.email}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                                    Telefon
                                </label>
                                <input
                                    type="tel"
                                    value={formData.yetkiliTelefon}
                                    onChange={e => setFormData({ ...formData, yetkiliTelefon: e.target.value })}
                                    className="w-full bg-slate-800/50 border border-slate-600 text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                                    placeholder="0532 xxx xx xx"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                                        Şifre *
                                    </label>
                                    <input
                                        type="password"
                                        value={formData.sifre}
                                        onChange={e => setFormData({ ...formData, sifre: e.target.value })}
                                        className="w-full bg-slate-800/50 border border-slate-600 text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                                        placeholder="••••••••"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                                        Şifre Tekrar *
                                    </label>
                                    <input
                                        type="password"
                                        value={formData.sifreTekrar}
                                        onChange={e => setFormData({ ...formData, sifreTekrar: e.target.value })}
                                        className="w-full bg-slate-800/50 border border-slate-600 text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Kategoriler */}
                    {step === 3 && (
                        <div className="space-y-5">
                            <h2 className="text-lg font-bold text-white mb-2">Hizmet Kategorileri</h2>
                            <p className="text-sm text-slate-400 mb-6">Firmanızın hizmet verdiği kategorileri seçiniz. En az bir kategori seçmelisiniz.</p>

                            <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2">
                                {kategoriler.map(kat => (
                                    <label
                                        key={kat.id}
                                        className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${formData.kategoriIds.includes(kat.id)
                                            ? 'bg-teal-500/20 border-teal-500 text-teal-300'
                                            : 'bg-slate-800/30 border-slate-600 text-slate-300 hover:border-slate-500'
                                            }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={formData.kategoriIds.includes(kat.id)}
                                            onChange={() => toggleKategori(kat.id)}
                                            className="sr-only"
                                        />
                                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${formData.kategoriIds.includes(kat.id)
                                            ? 'bg-teal-500 border-teal-500'
                                            : 'border-slate-500'
                                            }`}>
                                            {formData.kategoriIds.includes(kat.id) && (
                                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                        </div>
                                        <span className="text-sm font-medium">{kat.ad}</span>
                                    </label>
                                ))}
                            </div>

                            {kategoriler.length === 0 && (
                                <div className="text-center py-8 text-slate-500">
                                    Kategori yükleniyor...
                                </div>
                            )}
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex justify-between mt-8 pt-6 border-t border-slate-700">
                        {step > 1 ? (
                            <button
                                onClick={handleBack}
                                className="px-6 py-3 text-sm font-medium text-slate-300 hover:text-white transition-colors"
                            >
                                ← Geri
                            </button>
                        ) : (
                            <Link
                                href="/login"
                                className="px-6 py-3 text-sm font-medium text-slate-300 hover:text-white transition-colors"
                            >
                                ← Giriş Sayfası
                            </Link>
                        )}

                        {step < 3 ? (
                            <button
                                onClick={handleNext}
                                className="px-8 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-bold rounded-xl hover:from-teal-400 hover:to-emerald-400 transition-all shadow-lg shadow-teal-500/20"
                            >
                                Devam →
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="px-8 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-bold rounded-xl hover:from-teal-400 hover:to-emerald-400 transition-all shadow-lg shadow-teal-500/20 disabled:opacity-50"
                            >
                                {loading ? 'Kaydediliyor...' : 'Başvuruyu Gönder'}
                            </button>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-slate-500 text-xs mt-6">
                    Zaten hesabınız var mı? <Link href="/login" className="text-teal-400 hover:underline">Giriş yapın</Link>
                </p>
            </div>
        </div>
    )
}

export default function TedarikciKayitPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 flex items-center justify-center">
                <div className="text-white text-lg font-medium">Yükleniyor...</div>
            </div>
        }>
            <TedarikciKayitForm />
        </Suspense>
    )
}
