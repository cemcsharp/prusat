'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getTedarikci } from '@/lib/actions'
import Link from 'next/link'

export default function TedarikciDetayPage() {
    const params = useParams()
    const router = useRouter()
    const [tedarikci, setTedarikci] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (params.id) fetchData()
    }, [params.id])

    async function fetchData() {
        try {
            const data = await getTedarikci(Number(params.id))
            setTedarikci(data)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <div className="p-10 text-center uppercase tracking-widest text-[10px] text-slate-500">Veri Yükleniyor...</div>
    if (!tedarikci) return <div className="p-10 text-center uppercase tracking-widest text-[10px] text-slate-500">Tedarikçi bulunamadı.</div>

    return (
        <div className="flex flex-col gap-8 animate-in">
            {/* Header / Breadcrumb */}
            <div className="flex justify-between items-start border-b border-slate-200 pb-5">
                <div className="flex flex-col gap-2">
                    <button onClick={() => router.back()} className="text-[9px] text-slate-500 hover:text-slate-800 uppercase tracking-widest flex items-center gap-1 transition-colors w-fit">
                        ← Tedarikçi Listesine Dön
                    </button>
                    <div>
                        <h2 className="text-[18px] font-medium text-slate-800 uppercase tracking-widest">{tedarikci.ad}</h2>
                        <p className="text-[10px] text-slate-500 font-medium uppercase tracking-tighter">Kartvizit ve Performans Analizi</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <span className={`px-3 py-1 rounded text-[10px] font-medium border uppercase tracking-widest ${tedarikci.aktif ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-100'
                        }`}>
                        {tedarikci.aktif ? 'Aktif Portföy' : 'Pasif Kayıt'}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Information Card */}
                <div className="flex flex-col gap-6">
                    <div className="premium-card p-6">
                        <h3 className="text-[11px] font-medium text-slate-700 uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">İletişim ve Ünvan</h3>
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1">
                                <span className="text-[9px] text-slate-500 uppercase">Yetkili Kişi</span>
                                <span className="text-[12px] text-slate-700 font-medium">{tedarikci.yetkiliKisi || '-'}</span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-[9px] text-slate-500 uppercase">Vergi Numarası</span>
                                <span className="text-[12px] text-slate-700 font-medium font-mono">{tedarikci.vergiNo || '-'}</span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-[9px] text-slate-500 uppercase">E-Posta</span>
                                <span className="text-[12px] text-slate-700 font-medium lowercase">{tedarikci.email || '-'}</span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-[9px] text-slate-500 uppercase">Telefon</span>
                                <span className="text-[12px] text-slate-700 font-medium">{tedarikci.telefon || '-'}</span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-[9px] text-slate-500 uppercase">Adres</span>
                                <span className="text-[11px] text-slate-600 leading-relaxed italic">{tedarikci.adres || '-'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="premium-card p-6 bg-slate-50/50">
                        <h3 className="text-[11px] font-medium text-slate-700 uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">Hızlı İstatistikler</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-3 bg-white border border-slate-100 rounded">
                                <div className="text-[18px] font-medium text-slate-700">{tedarikci.siparislar.length}</div>
                                <div className="text-[8px] text-slate-500 uppercase">Toplam Sipariş</div>
                            </div>
                            <div className="text-center p-3 bg-white border border-slate-100 rounded">
                                <div className="text-[18px] font-medium text-slate-700">{tedarikci.degerlendirmeFormlari.length}</div>
                                <div className="text-[8px] text-slate-500 uppercase">Değerlendirme</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Performance History */}
                <div className="lg:col-span-2 flex flex-col gap-8">
                    <div className="premium-card overflow-hidden">
                        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                            <h3 className="text-[11px] font-medium text-slate-700 uppercase tracking-widest">Performans Değerlendirme Geçmişi</h3>
                        </div>
                        <div className="flex flex-col divide-y divide-slate-100">
                            {tedarikci.degerlendirmeFormlari.length === 0 ? (
                                <div className="p-10 text-center text-[10px] text-slate-500 uppercase tracking-widest">Henüz profesyonel değerlendirme yapılmamış.</div>
                            ) : tedarikci.degerlendirmeFormlari.map((f: any) => (
                                <div key={f.id} className="p-5 hover:bg-slate-50/50 transition-colors">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[10px] font-medium text-slate-700 uppercase tracking-tight">{f.formTipi.ad}</span>
                                            <span className="text-[9px] text-slate-500">{new Date(f.tarih).toLocaleDateString('tr-TR')} - {f.degerlendiren} tarafından</span>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className={`px-2 py-0.5 rounded text-[8px] font-bold border uppercase ${f.sonuc === 'ONAYLI' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                f.sonuc === 'CALISABILIR' ? 'bg-sky-50 text-sky-600 border-sky-100' :
                                                    f.sonuc === 'SARTLI' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                        'bg-rose-50 text-rose-600 border-rose-100'
                                                }`}>
                                                {f.sonuc}
                                            </span>
                                            <span className="text-[14px] font-bold text-slate-700">{f.genelPuan.toFixed(2)}</span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 bg-white p-3 rounded border border-slate-50 shadow-sm">
                                        {f.cevaplar.map((c: any) => (
                                            <div key={c.id} className="flex flex-col gap-0.5">
                                                <span className="text-[8px] text-slate-500 uppercase truncate" title={c.soru.soru}>{c.soru.soru}</span>
                                                <div className="flex items-center gap-1.5">
                                                    <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                                                        <div className="h-full bg-slate-400" style={{ width: `${(c.puan / 5) * 100}%` }}></div>
                                                    </div>
                                                    <span className="text-[9px] font-medium text-slate-600">{c.puan}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="premium-card overflow-hidden">
                        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
                            <h3 className="text-[11px] font-medium text-slate-700 uppercase tracking-widest">Sipariş Kayıtları</h3>
                        </div>
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/20 text-slate-500 text-[9px] uppercase font-medium tracking-widest border-b border-slate-50">
                                <tr>
                                    <th className="px-5 py-3">Barkod / Konu</th>
                                    <th className="px-5 py-3">Tarih</th>
                                    <th className="px-5 py-3">Finans</th>
                                    <th className="px-5 py-3 text-right">Durum</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 text-[11px]">
                                {tedarikci.siparislar.length === 0 ? (
                                    <tr><td colSpan={4} className="p-10 text-center uppercase tracking-widest text-[9px] text-slate-400">İşlem geçmişi bulunmuyor.</td></tr>
                                ) : tedarikci.siparislar.map((s: any) => (
                                    <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-5 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-slate-700 font-medium uppercase tracking-tight">{s.talep.konu}</span>
                                                <span className="text-[9px] text-slate-500 font-mono">{s.barkod}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-slate-500">
                                            {new Date(s.tarih).toLocaleDateString('tr-TR')}
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-slate-600 font-medium">
                                                    {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(s.faturalar.reduce((acc: number, f: any) => acc + Number(f.tutar), 0))}
                                                </span>
                                                <span className="text-[8px] text-slate-500 uppercase tracking-tighter">{s.faturalar.length} Fatura / {s.sozlesmeler.length} Sözleşme</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <span className={`px-2 py-0.5 rounded text-[8px] font-bold border uppercase tracking-tighter ${s.durum === 'TAMAMLANDI' ? 'bg-sky-50 text-sky-600 border-sky-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                }`}>
                                                {s.durum}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}
