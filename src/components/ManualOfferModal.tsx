'use client'

import { useState } from 'react'
import FileUpload from './FileUpload'

interface ManualOfferModalProps {
    isOpen: boolean
    onClose: () => void
    rfq: any
    onSubmit: (data: any) => Promise<any>
}

export default function ManualOfferModal({ isOpen, onClose, rfq, onSubmit }: ManualOfferModalProps) {
    const [selectedTedarikciId, setSelectedTedarikciId] = useState('')
    const [hariciTedarikciAdi, setHariciTedarikciAdi] = useState('')
    const [isHarici, setIsHarici] = useState(false)
    const [paraBirimi, setParaBirimi] = useState('TRY')
    const [teslimSuresi, setTeslimSuresi] = useState('7')
    const [kalemFiyatlari, setKalemFiyatlari] = useState<Record<number, string>>({})
    const [saving, setSaving] = useState(false)
    const [createdTeklifId, setCreatedTeklifId] = useState<number | null>(null)

    if (!isOpen) return null

    const handleTedarikciChange = (val: string) => {
        if (val === 'HARICI') {
            setIsHarici(true)
            setSelectedTedarikciId('')
        } else {
            setIsHarici(false)
            setSelectedTedarikciId(val)
            setHariciTedarikciAdi('')
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!isHarici && !selectedTedarikciId) return alert('Lütfen tedarikçi seçiniz.')
        if (isHarici && !hariciTedarikciAdi) return alert('Lütfen firma adını giriniz.')

        setSaving(true)
        try {
            const payload = {
                tedarikciId: isHarici ? undefined : parseInt(selectedTedarikciId),
                hariciTedarikciAdi: isHarici ? hariciTedarikciAdi : undefined,
                paraBirimi,
                teslimSuresi: parseInt(teslimSuresi),
                kalemler: rfq.kalemler.map((k: any) => ({
                    talepKalemId: k.talepKalemId,
                    birimFiyat: parseFloat(kalemFiyatlari[k.talepKalemId] || '0')
                }))
            }
            const result = await onSubmit(payload)
            if (result && result.id) {
                setCreatedTeklifId(result.id)
            } else {
                onClose()
            }
        } catch (err) {
            alert('Hata: ' + (err as Error).message)
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div>
                        <h2 className="text-base font-bold text-slate-800 uppercase tracking-widest">
                            {createdTeklifId ? 'Teklif Belgeleri' : 'Harici Teklif Girişi'}
                        </h2>
                        <p className="text-[10px] text-slate-500 uppercase mt-0.5 font-medium tracking-tighter">
                            {createdTeklifId ? 'Teklife ait dökümanları yükleyin' : 'Portal dışı alınan teklifleri sisteme işleyin'}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {createdTeklifId ? (
                    <div className="p-10 space-y-6 text-center">
                        <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">Teklif Kaydedildi!</h3>
                        <p className="text-sm text-slate-500">Şimdi teklife ait varsa dökümanları (PDF, Excel, Görsel vb.) yükleyebilirsiniz.</p>

                        <FileUpload
                            relatedEntity="TEKLIF"
                            entityId={createdTeklifId}
                            label="TEKLİF DOSYALARI YÜKLE"
                        />

                        <button
                            onClick={onClose}
                            className="w-full bg-slate-900 text-white py-3 rounded-xl text-xs font-bold uppercase hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
                        >
                            İşlemi Tamamla
                        </button>
                    </div>
                ) : (
                    <>
                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className={isHarici ? 'col-span-2' : ''}>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1.5 tracking-widest">Tedarikçi Seçimi</label>
                                    <div className="flex gap-2">
                                        <select
                                            value={isHarici ? 'HARICI' : selectedTedarikciId}
                                            onChange={(e) => handleTedarikciChange(e.target.value)}
                                            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 transition-all font-medium"
                                            required
                                        >
                                            <option value="">Seçiniz...</option>
                                            {rfq.tedarikciler.map((t: any) => (
                                                <option key={t.tedarikci.id} value={t.tedarikci.id}>{t.tedarikci.ad}</option>
                                            ))}
                                            <option value="HARICI" className="text-indigo-600 font-bold">+ Sistem Dışı Firma</option>
                                        </select>
                                    </div>
                                </div>
                                {isHarici && (
                                    <div className="col-span-2 animate-in slide-in-from-top-2">
                                        <label className="block text-[10px] font-black text-slate-500 uppercase mb-1.5 tracking-widest">Firma Adı</label>
                                        <input
                                            type="text"
                                            value={hariciTedarikciAdi}
                                            onChange={(e) => setHariciTedarikciAdi(e.target.value)}
                                            placeholder="Firma adını yazınız..."
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 transition-all font-bold"
                                            required
                                        />
                                    </div>
                                )}
                                {!isHarici && (
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 uppercase mb-1.5 tracking-widest">Para Birimi</label>
                                        <select
                                            value={paraBirimi}
                                            onChange={(e) => setParaBirimi(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 transition-all font-medium"
                                        >
                                            <option value="TRY">TRY (₺)</option>
                                            <option value="USD">USD ($)</option>
                                            <option value="EUR">EUR (€)</option>
                                            <option value="GBP">GBP (£)</option>
                                        </select>
                                    </div>
                                )}
                            </div>

                            {isHarici && (
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1.5 tracking-widest">Para Birimi</label>
                                    <select
                                        value={paraBirimi}
                                        onChange={(e) => setParaBirimi(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 transition-all font-medium"
                                    >
                                        <option value="TRY">TRY (₺)</option>
                                        <option value="USD">USD ($)</option>
                                        <option value="EUR">EUR (€)</option>
                                        <option value="GBP">GBP (£)</option>
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase mb-3 tracking-widest">Kalem Bazlı Birim Fiyatlar</label>
                                <div className="space-y-3 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                                    {rfq.kalemler.map((k: any) => (
                                        <div key={k.id} className="flex items-center gap-4 bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                                            <div className="flex-1">
                                                <div className="text-xs font-bold text-slate-800 uppercase truncate">{k.talepKalem.aciklama}</div>
                                                <div className="text-[10px] text-slate-400 uppercase font-medium mt-0.5">{k.miktar || k.talepKalem.miktar} {k.talepKalem.birim}</div>
                                            </div>
                                            <div className="w-32 relative">
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-right font-mono font-bold outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                                                    placeholder="0.00"
                                                    value={kalemFiyatlari[k.talepKalemId] || ''}
                                                    onChange={(e) => setKalemFiyatlari({ ...kalemFiyatlari, [k.talepKalemId]: e.target.value })}
                                                    required
                                                />
                                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-300 font-bold">{paraBirimi}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1.5 tracking-widest">Teslim Süresi (Gün)</label>
                                    <input
                                        type="number"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 transition-all font-bold"
                                        value={teslimSuresi}
                                        onChange={(e) => setTeslimSuresi(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                        </form>

                        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 uppercase hover:bg-white transition-all"
                            >
                                İptal
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={saving}
                                className="flex-[2] bg-slate-900 text-white px-4 py-3 rounded-xl text-xs font-bold uppercase hover:bg-slate-800 disabled:opacity-50 shadow-xl shadow-slate-200 transition-all flex items-center justify-center gap-2"
                            >
                                {saving ? (
                                    <>
                                        <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        Teklif İşleniyor...
                                    </>
                                ) : 'Teklifi Kaydet'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
