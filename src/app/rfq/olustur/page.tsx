'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getOnayliTalepler, createRFQ, getPersoneller, getTedarikciKategorileri, finalizeAttachments } from '@/lib/actions'
import { useNotification } from '@/context/NotificationContext'
import FileUpload from '@/components/FileUpload'
import AttachmentList from '@/components/AttachmentList'
import { useSession } from 'next-auth/react'

export default function RFQOlusturPage() {
    const { data: session } = useSession()
    const router = useRouter()
    const [talepler, setTalepler] = useState<any[]>([])
    const [personeller, setPersoneller] = useState<any[]>([])
    const [kategoriler, setKategoriler] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const { showAlert } = useNotification()
    const [tempId] = useState(() => Math.floor(Math.random() * 1000000))
    const [refreshFiles, setRefreshFiles] = useState(0)

    // Form state
    const [baslik, setBaslik] = useState('')
    const [aciklama, setAciklama] = useState('')
    const [sonTeklifTarihi, setSonTeklifTarihi] = useState('')
    const [olusturanId, setOlusturanId] = useState('')
    const [kategoriId, setKategoriId] = useState('')
    const [selectedKalemler, setSelectedKalemler] = useState<{ talepId: number, talepKalemId: number, miktar?: number }[]>([])
    // Puanlama ağırlıkları
    const [agirlikFiyat, setAgirlikFiyat] = useState(100)
    const [agirlikVade, setAgirlikVade] = useState(0)
    const [agirlikTeslimat, setAgirlikTeslimat] = useState(0)
    const [agirlikPerformans, setAgirlikPerformans] = useState(0)

    const [externalEmails, setExternalEmails] = useState<string[]>([])
    const [currentEmail, setCurrentEmail] = useState('')

    useEffect(() => {
        const personelId = session?.user?.personelId
        if (personelId) {
            setOlusturanId(personelId.toString())
        }
    }, [session])

    useEffect(() => {
        fetchData()
    }, [])

    async function fetchData() {
        try {
            const [talepData, personelData, kategoriData] = await Promise.all([
                getOnayliTalepler(),
                getPersoneller(),
                getTedarikciKategorileri()
            ])
            setTalepler(talepData)
            setPersoneller(personelData)
            setKategoriler(kategoriData)

            // Varsayılan son tarih: 7 gün sonra saat 17:00
            const defaultDate = new Date()
            defaultDate.setDate(defaultDate.getDate() + 7)
            defaultDate.setHours(17, 0, 0, 0)

            // datetime-local format: YYYY-MM-DDTHH:mm
            const year = defaultDate.getFullYear()
            const month = String(defaultDate.getMonth() + 1).padStart(2, '0')
            const day = String(defaultDate.getDate()).padStart(2, '0')
            const hours = String(defaultDate.getHours()).padStart(2, '0')
            const minutes = String(defaultDate.getMinutes()).padStart(2, '0')

            setSonTeklifTarihi(`${year}-${month}-${day}T${hours}:${minutes}`)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    function toggleKalem(talepId: number, kalemId: number, miktar: number) {
        const exists = selectedKalemler.find(k => k.talepKalemId === kalemId)
        if (exists) {
            setSelectedKalemler(selectedKalemler.filter(k => k.talepKalemId !== kalemId))
        } else {
            setSelectedKalemler([...selectedKalemler, { talepId, talepKalemId: kalemId }])
        }
    }

    function toggleTalep(talep: any) {
        const allKalemIds = talep.kalemler.map((k: any) => k.id)
        const allSelected = allKalemIds.every((id: number) =>
            selectedKalemler.find(sk => sk.talepKalemId === id)
        )

        if (allSelected) {
            // Tüm kalemleri kaldır
            setSelectedKalemler(selectedKalemler.filter(sk =>
                !allKalemIds.includes(sk.talepKalemId)
            ))
        } else {
            // Tüm kalemleri ekle
            const newKalemler = talep.kalemler
                .filter((k: any) => !selectedKalemler.find(sk => sk.talepKalemId === k.id))
                .map((k: any) => ({ talepId: talep.id, talepKalemId: k.id }))
            setSelectedKalemler([...selectedKalemler, ...newKalemler])
        }
    }

    function addEmail() {
        if (!currentEmail) return
        if (!currentEmail.includes('@')) {
            showAlert('Lütfen geçerli bir e-posta adresi giriniz.', 'warning')
            return
        }
        if (externalEmails.includes(currentEmail)) {
            showAlert('Bu e-posta zaten eklendi.', 'info')
            return
        }
        setExternalEmails([...externalEmails, currentEmail])
        setCurrentEmail('')
    }

    function removeEmail(email: string) {
        setExternalEmails(externalEmails.filter(e => e !== email))
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (selectedKalemler.length === 0) {
            showAlert('Lütfen en az bir kalem seçiniz.', 'warning')
            return
        }
        if (!olusturanId) {
            showAlert('Oturum bilgisi alınamadı. Lütfen sayfayı yenileyin.', 'warning')
            return
        }

        setSubmitting(true)
        try {
            const rfq = await createRFQ({
                baslik,
                aciklama: aciklama || undefined,
                sonTeklifTarihi: new Date(sonTeklifTarihi),
                olusturanId: parseInt(olusturanId),
                kategoriId: kategoriId ? parseInt(kategoriId) : undefined,
                agirlikFiyat,
                agirlikVade,
                agirlikTeslimat,
                agirlikPerformans,
                kalemler: selectedKalemler,
                externalEmails: externalEmails.length > 0 ? externalEmails : undefined
            })

            // Dosyaları kesinleştir
            await finalizeAttachments('RFQ_DRAFT', tempId, 'RFQ', rfq.id)

            showAlert('RFQ başarıyla oluşturuldu!', 'success')
            router.push(`/rfq/${rfq.id}`)
        } catch (err) {
            showAlert('Hata: ' + (err as Error).message, 'error')
        } finally {
            setSubmitting(false)
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

    return (
        <div className="flex flex-col gap-5 animate-in">
            {/* Page Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-lg font-bold text-slate-800 tracking-wide">Yeni RFQ Oluştur</h1>
                    <p className="text-xs text-slate-400 mt-0.5">Onaylı taleplerden kalem seçerek teklif istemi oluşturun</p>
                </div>
                <button
                    onClick={() => router.back()}
                    className="text-slate-500 hover:text-slate-700 text-xs font-medium uppercase"
                >
                    ← Geri
                </button>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-3 gap-6">
                {/* Sol: Talep Seçimi */}
                <div className="col-span-2 bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-slate-50">
                        <h2 className="text-sm font-bold text-slate-700">Talep Kalemleri Seçimi</h2>
                        <p className="text-[10px] text-slate-400 mt-0.5">RFQ'ya dahil edilecek kalemleri işaretleyin</p>
                    </div>
                    <div className="p-4 max-h-[600px] overflow-y-auto">
                        {talepler.length === 0 ? (
                            <div className="text-center py-8 text-slate-400">
                                <div className="text-3xl mb-2">📋</div>
                                <p className="text-sm">Onaylı talep bulunmuyor.</p>
                                <p className="text-xs mt-1">Önce talepleri onaylayın.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {talepler.map(talep => {
                                    const selectedCount = talep.kalemler.filter((k: any) =>
                                        selectedKalemler.find(sk => sk.talepKalemId === k.id)
                                    ).length
                                    const allSelected = selectedCount === talep.kalemler.length

                                    return (
                                        <div key={talep.id} className="border border-slate-100 rounded-lg overflow-hidden">
                                            {/* Talep Başlık */}
                                            <div
                                                className="flex items-center gap-3 p-3 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors"
                                                onClick={() => toggleTalep(talep)}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={allSelected}
                                                    onChange={() => toggleTalep(talep)}
                                                    className="w-4 h-4 rounded"
                                                />
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-mono text-xs font-bold text-slate-600">{talep.barkod}</span>
                                                        <span className="text-xs text-slate-800 font-medium">{talep.konu}</span>
                                                    </div>
                                                    <div className="text-[10px] text-slate-400 mt-0.5">
                                                        {talep.ilgiliKisi.adSoyad} · {talep.kalemler.length} kalem
                                                    </div>
                                                </div>
                                                {selectedCount > 0 && (
                                                    <span className="bg-indigo-100 text-indigo-700 text-[10px] px-2 py-0.5 rounded font-bold">
                                                        {selectedCount} seçili
                                                    </span>
                                                )}
                                            </div>

                                            {/* Kalemler */}
                                            <div className="border-t border-slate-100">
                                                {talep.kalemler.map((kalem: any) => {
                                                    const isSelected = selectedKalemler.find(sk => sk.talepKalemId === kalem.id)
                                                    return (
                                                        <div
                                                            key={kalem.id}
                                                            className={`flex items-center gap-3 px-4 py-2 cursor-pointer transition-colors ${isSelected ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}
                                                            onClick={() => toggleKalem(talep.id, kalem.id, kalem.miktar)}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={!!isSelected}
                                                                onChange={() => toggleKalem(talep.id, kalem.id, kalem.miktar)}
                                                                className="w-3.5 h-3.5 rounded"
                                                            />
                                                            <div className="flex-1 text-xs text-slate-700">{kalem.aciklama}</div>
                                                            <div className="text-xs text-slate-500">{kalem.miktar} {kalem.birim}</div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Sağ: RFQ Bilgileri */}
                <div className="flex flex-col gap-5">
                    <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
                        <div className="p-4 border-b border-slate-100 bg-slate-50">
                            <h2 className="text-sm font-bold text-slate-700">RFQ Bilgileri</h2>
                        </div>
                        <div className="p-4 flex flex-col gap-4">
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-medium text-slate-500 uppercase">Başlık *</label>
                                <input
                                    type="text"
                                    required
                                    className="bg-white border border-slate-200 p-2 rounded text-xs outline-none focus:ring-2 focus:ring-slate-200"
                                    value={baslik}
                                    onChange={(e) => setBaslik(e.target.value)}
                                    placeholder="Örn: Hidrolik malzeme alımı"
                                />
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-medium text-slate-500 uppercase">Açıklama</label>
                                <textarea
                                    rows={2}
                                    className="bg-white border border-slate-200 p-2 rounded text-xs outline-none focus:ring-2 focus:ring-slate-200 resize-none"
                                    value={aciklama}
                                    onChange={(e) => setAciklama(e.target.value)}
                                    placeholder="İsteğe bağlı detaylar..."
                                />
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-medium text-slate-500 uppercase">Son Teklif Tarihi ve Saati *</label>
                                <input
                                    type="datetime-local"

                                    required
                                    className="bg-white border border-slate-200 p-2 rounded text-xs outline-none focus:ring-2 focus:ring-slate-200"
                                    value={sonTeklifTarihi}
                                    onChange={(e) => setSonTeklifTarihi(e.target.value)}
                                />
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                                    <span className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse"></span>
                                    OLUŞTURAN PERSONEL
                                </label>
                                <div className="bg-slate-50 border border-slate-200 p-2.5 rounded text-xs font-black text-indigo-600 flex items-center gap-2">
                                    <span className="opacity-50">👤</span>
                                    {session?.user?.name?.toUpperCase() || 'YÜKLENİYOR...'}
                                </div>
                                <p className="text-[8px] text-slate-400 font-bold italic uppercase">* OTURUM BİLGİSİNDEN OTOMATİKLERDİ</p>
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-medium text-slate-500 uppercase">Tedarikçi Kategorisi</label>
                                <select
                                    className="bg-white border border-slate-200 p-2 rounded text-xs outline-none focus:ring-2 focus:ring-slate-200"
                                    value={kategoriId}
                                    onChange={(e) => setKategoriId(e.target.value)}
                                >
                                    <option value="">Seçiniz (Opsiyonel)</option>
                                    {kategoriler.map(k => (
                                        <option key={k.id} value={k.id}>{k.ad}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Akıllı Puanlama Ağırlıkları */}
                    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden border-indigo-100">
                        <div className="p-4 border-b border-indigo-50 bg-indigo-50/30">
                            <h2 className="text-sm font-bold text-indigo-900">Akıllı Seçim Ağırlıkları</h2>
                            <p className="text-[10px] text-indigo-400 mt-0.5">Firmalar bu kriterlere göre puanlanacaktır (Toplam %100 olmalı)</p>
                        </div>
                        <div className="p-4 space-y-4">
                            {[
                                { label: 'Fiyat', value: agirlikFiyat, setter: setAgirlikFiyat, icon: '💰' },
                                { label: 'Vade', value: agirlikVade, setter: setAgirlikVade, icon: '📅' },
                                { label: 'Teslimat', value: agirlikTeslimat, setter: setAgirlikTeslimat, icon: '🚚' },
                                { label: 'Performans', value: agirlikPerformans, setter: setAgirlikPerformans, icon: '⭐' }
                            ].map((item) => (
                                <div key={item.label} className="flex flex-col gap-1.5">
                                    <div className="flex justify-between items-center">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                                            <span>{item.icon}</span> {item.label}
                                        </label>
                                        <span className="text-[10px] font-bold text-indigo-600">%{item.value}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        step="5"
                                        value={item.value}
                                        onChange={(e) => item.setter(parseInt(e.target.value))}
                                        className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                    />
                                </div>
                            ))}

                            <div className={`p-2 rounded text-center font-bold text-[10px] ${agirlikFiyat + agirlikVade + agirlikTeslimat + agirlikPerformans === 100 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                Toplam: %{agirlikFiyat + agirlikVade + agirlikTeslimat + agirlikPerformans}
                                {agirlikFiyat + agirlikVade + agirlikTeslimat + agirlikPerformans !== 100 && (
                                    <p className="font-normal mt-0.5">Toplam ağırlık %100 olmalıdır!</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Harici Tedarikçi Daveti */}
                    <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
                        <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                            <h2 className="text-sm font-bold text-slate-700">Harici Tedarikçiler</h2>
                            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">YENİ</span>
                        </div>
                        <div className="p-4 space-y-3">
                            <div className="flex gap-2">
                                <input
                                    type="email"
                                    placeholder="E-posta adresi..."
                                    className="flex-1 bg-white border border-slate-200 p-2 rounded text-xs outline-none focus:ring-2 focus:ring-indigo-100"
                                    value={currentEmail}
                                    onChange={(e) => setCurrentEmail(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addEmail())}
                                />
                                <button
                                    type="button"
                                    onClick={addEmail}
                                    className="bg-indigo-600 text-white px-3 rounded text-xs font-bold hover:bg-indigo-700 transition-colors"
                                >
                                    Ekle
                                </button>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {externalEmails.length === 0 ? (
                                    <p className="text-[10px] text-slate-400 italic">Henüz e-posta eklenmedi.</p>
                                ) : (
                                    externalEmails.map(email => (
                                        <div key={email} className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-2 py-1 rounded text-[10px] text-slate-600">
                                            <span>{email}</span>
                                            <button
                                                type="button"
                                                onClick={() => removeEmail(email)}
                                                className="text-slate-400 hover:text-rose-500 transition-colors"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                            <p className="text-[9px] text-slate-400 leading-tight">
                                Eklenen e-posta adreslerine RFQ yayınlandığında otomatik davet gönderilir.
                            </p>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
                        {/* Dosyalar (Creation) */}
                        <div className="p-4 border-b border-slate-100 bg-slate-50">
                            <label className="text-sm font-bold text-slate-700">Şartname / Dökümanlar</label>
                        </div>
                        <div className="p-4">
                            <AttachmentList relatedEntity="RFQ_DRAFT" entityId={tempId} refreshTrigger={refreshFiles} />
                            <div className="mt-2">
                                <FileUpload
                                    relatedEntity="RFQ_DRAFT"
                                    entityId={tempId}
                                    onSuccess={() => setRefreshFiles(prev => prev + 1)}
                                    label="Döküman Seç"
                                />
                            </div>
                        </div>

                        {/* Seçim Özeti */}
                        <div className="border-t border-slate-100 p-4">
                            <div className="flex justify-between items-center text-xs mb-3">
                                <span className="text-slate-500">Seçili Kalem:</span>
                                <span className="font-bold text-slate-800">{selectedKalemler.length}</span>
                            </div>
                            <button
                                type="submit"
                                disabled={submitting || selectedKalemler.length === 0}
                                className="w-full bg-slate-700 text-white py-2.5 rounded text-xs font-bold uppercase hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-slate-100"
                            >
                                {submitting ? 'Oluşturuluyor...' : 'RFQ Oluştur'}
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    )
}
