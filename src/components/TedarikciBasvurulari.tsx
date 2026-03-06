'use client'

import { useState, useEffect } from 'react'
import { getBekleyenBasvurular, approveTedarikci, rejectTedarikci, createDavet } from '@/lib/portalActions'
import { useNotification } from '@/context/NotificationContext'

interface Tedarikci {
    id: number
    ad: string
    yetkiliKisi: string | null
    telefon: string | null
    email: string | null
    vergiNo: string | null
    vergiDairesi: string | null
    basvuruTarihi: Date | null
    kategori: { id: number; ad: string } | null
}

export default function TedarikciBasvurulari({ onRefresh }: { onRefresh?: () => void }) {
    const [basvurular, setBasvurular] = useState<Tedarikci[]>([])
    const [loading, setLoading] = useState(true)
    const [processing, setProcessing] = useState<number | null>(null)
    const { showAlert, showConfirm } = useNotification()

    // Davet Modal
    const [showDavetModal, setShowDavetModal] = useState(false)
    const [davetForm, setDavetForm] = useState({ email: '', firmaAdi: '' })
    const [davetLoading, setDavetLoading] = useState(false)
    const [generatedLink, setGeneratedLink] = useState('')

    const fetchBasvurular = async () => {
        setLoading(true)
        const data = await getBekleyenBasvurular()
        setBasvurular(data as Tedarikci[])
        setLoading(false)
    }

    useEffect(() => {
        fetchBasvurular()
    }, [])

    const handleApprove = async (id: number, ad: string) => {
        const confirmed = await showConfirm(`"${ad}" tedarikçisini onaylamak istediğinize emin misiniz?`)
        if (!confirmed) return

        setProcessing(id)
        // TODO: Get actual user ID from session
        const result = await approveTedarikci(id, 'system')
        setProcessing(null)

        if (result.success) {
            showAlert('Tedarikçi başarıyla onaylandı.', 'success')
            fetchBasvurular()
            onRefresh?.()
        } else {
            showAlert(result.error || 'Onay işlemi başarısız.', 'error')
        }
    }

    const handleReject = async (id: number, ad: string) => {
        const confirmed = await showConfirm(`"${ad}" başvurusunu reddetmek istediğinize emin misiniz?`)
        if (!confirmed) return

        setProcessing(id)
        const result = await rejectTedarikci(id, 'system')
        setProcessing(null)

        if (result.success) {
            showAlert('Başvuru reddedildi.', 'success')
            fetchBasvurular()
            onRefresh?.()
        } else {
            showAlert(result.error || 'Ret işlemi başarısız.', 'error')
        }
    }

    const handleDavetGonder = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!davetForm.email) {
            showAlert('E-posta zorunludur.', 'error')
            return
        }

        setDavetLoading(true)
        const result = await createDavet(
            davetForm.email,
            davetForm.firmaAdi || null,
            [],
            'system' // TODO: Get actual user ID
        )
        setDavetLoading(false)

        if (result.success && result.token) {
            const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
            const link = `${baseUrl}/kayit/tedarikci?token=${result.token}`
            setGeneratedLink(link)
            showAlert('Davet linki oluşturuldu!', 'success')
        } else {
            showAlert(result.error || 'Davet oluşturulamadı.', 'error')
        }
    }

    const copyToClipboard = () => {
        navigator.clipboard.writeText(generatedLink)
        showAlert('Link panoya kopyalandı!', 'success')
    }

    const resetDavetModal = () => {
        setShowDavetModal(false)
        setDavetForm({ email: '', firmaAdi: '' })
        setGeneratedLink('')
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-[13px] font-bold text-slate-700 uppercase tracking-wider">
                        Bekleyen Başvurular
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                        Self-registration ile gelen tedarikçi başvuruları
                    </p>
                </div>
                <button
                    onClick={() => setShowDavetModal(true)}
                    className="px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-[11px] font-bold uppercase tracking-wider rounded-lg hover:from-teal-400 hover:to-emerald-400 transition-all shadow-lg shadow-teal-500/20"
                >
                    + Tedarikçi Davet Et
                </button>
            </div>

            {/* Başvuru Listesi */}
            {loading ? (
                <div className="text-center py-12 text-slate-400">Yükleniyor...</div>
            ) : basvurular.length === 0 ? (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center">
                    <div className="text-3xl mb-3 opacity-30">📭</div>
                    <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">
                        Bekleyen başvuru bulunmuyor
                    </p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {basvurular.map(t => (
                        <div
                            key={t.id}
                            className="bg-white border border-slate-200 rounded-xl p-5 hover:border-teal-500/50 transition-all"
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h4 className="text-[13px] font-bold text-slate-800">
                                            {t.ad}
                                        </h4>
                                        {t.kategori && (
                                            <span className="px-2 py-0.5 bg-teal-50 text-teal-600 text-[9px] font-bold uppercase rounded-full">
                                                {t.kategori.ad}
                                            </span>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[10px]">
                                        <div>
                                            <span className="text-slate-400 block">Yetkili</span>
                                            <span className="text-slate-700 font-medium">{t.yetkiliKisi || '-'}</span>
                                        </div>
                                        <div>
                                            <span className="text-slate-400 block">E-posta</span>
                                            <span className="text-slate-700 font-medium">{t.email || '-'}</span>
                                        </div>
                                        <div>
                                            <span className="text-slate-400 block">Telefon</span>
                                            <span className="text-slate-700 font-medium">{t.telefon || '-'}</span>
                                        </div>
                                        <div>
                                            <span className="text-slate-400 block">Başvuru Tarihi</span>
                                            <span className="text-slate-700 font-medium">
                                                {t.basvuruTarihi ? new Date(t.basvuruTarihi).toLocaleDateString('tr-TR') : '-'}
                                            </span>
                                        </div>
                                    </div>

                                    {t.vergiNo && (
                                        <div className="mt-2 text-[9px] text-slate-400">
                                            VN: {t.vergiNo} • VD: {t.vergiDairesi}
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-2 ml-4">
                                    <button
                                        onClick={() => handleApprove(t.id, t.ad)}
                                        disabled={processing === t.id}
                                        className="px-3 py-1.5 bg-emerald-500 text-white text-[10px] font-bold uppercase rounded-lg hover:bg-emerald-600 transition-all disabled:opacity-50"
                                    >
                                        {processing === t.id ? '...' : '✓ Onayla'}
                                    </button>
                                    <button
                                        onClick={() => handleReject(t.id, t.ad)}
                                        disabled={processing === t.id}
                                        className="px-3 py-1.5 bg-rose-500 text-white text-[10px] font-bold uppercase rounded-lg hover:bg-rose-600 transition-all disabled:opacity-50"
                                    >
                                        ✕ Reddet
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Davet Modal */}
            {showDavetModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-slate-800">Tedarikçi Davet Et</h3>
                            <button
                                onClick={resetDavetModal}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                ✕
                            </button>
                        </div>

                        {generatedLink ? (
                            <div className="space-y-4">
                                <div className="bg-teal-50 border border-teal-200 rounded-xl p-4">
                                    <p className="text-[11px] text-teal-700 font-medium mb-2">
                                        ✓ Davet linki oluşturuldu (14 gün geçerli)
                                    </p>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            readOnly
                                            value={generatedLink}
                                            className="flex-1 bg-white border border-teal-200 text-[10px] text-slate-600 px-3 py-2 rounded-lg"
                                        />
                                        <button
                                            onClick={copyToClipboard}
                                            className="px-3 py-2 bg-teal-500 text-white text-[10px] font-bold rounded-lg hover:bg-teal-600"
                                        >
                                            Kopyala
                                        </button>
                                    </div>
                                </div>

                                <button
                                    onClick={resetDavetModal}
                                    className="w-full py-2 bg-slate-100 text-slate-600 text-[11px] font-bold uppercase rounded-lg hover:bg-slate-200"
                                >
                                    Kapat
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleDavetGonder} className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                                        E-posta Adresi *
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        value={davetForm.email}
                                        onChange={e => setDavetForm({ ...davetForm, email: e.target.value })}
                                        className="w-full border border-slate-200 px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                                        placeholder="tedarikci@firma.com"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                                        Firma Adı (Opsiyonel)
                                    </label>
                                    <input
                                        type="text"
                                        value={davetForm.firmaAdi}
                                        onChange={e => setDavetForm({ ...davetForm, firmaAdi: e.target.value })}
                                        className="w-full border border-slate-200 px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                                        placeholder="ABC Elektrik Ltd. Şti."
                                    />
                                </div>

                                <div className="text-[9px] text-slate-400 bg-slate-50 p-3 rounded-lg">
                                    💡 Davet linki 14 gün geçerlidir. Aynı e-postaya tekrar davet gönderilebilir (eski link iptal olur).
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={resetDavetModal}
                                        className="flex-1 py-2 bg-slate-100 text-slate-600 text-[11px] font-bold uppercase rounded-lg hover:bg-slate-200"
                                    >
                                        İptal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={davetLoading}
                                        className="flex-1 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-[11px] font-bold uppercase rounded-lg hover:from-teal-400 hover:to-emerald-400 disabled:opacity-50"
                                    >
                                        {davetLoading ? 'Oluşturuluyor...' : 'Link Oluştur'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
