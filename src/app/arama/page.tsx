'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { searchGlobal } from '@/lib/actions'
import Link from 'next/navigation'

function AramaSonuclari() {
    const searchParams = useSearchParams()
    const query = searchParams.get('q') || ''
    const [results, setResults] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchResults() {
            if (!query) {
                setResults({ talepler: [], rfqs: [], siparisler: [] })
                setLoading(false)
                return
            }
            setLoading(true)
            try {
                const data = await searchGlobal(query)
                setResults(data)
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }
        fetchResults()
    }, [query])

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                <div className="w-12 h-12 border-4 border-slate-200 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Sistem taranıyor...</p>
            </div>
        )
    }

    const hasResults = results && (
        results.talepler.length > 0 ||
        results.rfqs.length > 0 ||
        results.siparisler.length > 0 ||
        results.sozlesmeler?.length > 0 ||
        results.tedarikciler?.length > 0 ||
        results.faturalar?.length > 0
    )

    return (
        <div className="flex flex-col gap-8 animate-in fade-in duration-500">
            <div className="border-b border-slate-200 pb-5">
                <h1 className="text-2xl font-black text-slate-800 tracking-tight uppercase">
                    Arama Sonuçları
                </h1>
                <p className="text-slate-500 text-sm mt-1 font-medium">
                    &quot;<span className="text-indigo-600 font-bold">{query}</span>&quot; terimi için bulunan kayıtlar.
                </p>
            </div>

            {!hasResults ? (
                <div className="bg-white rounded-2xl border border-slate-100 p-20 text-center shadow-sm">
                    <div className="text-6xl mb-4">🔍</div>
                    <h2 className="text-lg font-bold text-slate-700 uppercase tracking-widest">Sonuç Bulunamadı</h2>
                    <p className="text-slate-400 text-xs mt-2 max-w-xs mx-auto">Arama kriterlerinize uygun kayıt bulunamadı. Lütfen farklı bir terim deneyin.</p>
                    <a href="/" className="inline-block mt-8 text-indigo-600 font-bold uppercase tracking-tighter text-xs border-b-2 border-indigo-100 hover:border-indigo-600 transition-all pb-1">Panele Geri Dön</a>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Talepler */}
                    {results.talepler.length > 0 && (
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-2 px-1">
                                <span className="text-lg">📝</span>
                                <h2 className="font-bold text-slate-800 uppercase tracking-widest text-[11px]">Satınalma Talepleri ({results.talepler.length})</h2>
                            </div>
                            <div className="flex flex-col gap-3">
                                {results.talepler.map((t: any) => (
                                    <a key={t.id} href="/talepler" className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all group">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="font-mono text-[10px] font-bold text-slate-400 group-hover:text-indigo-500">{t.barkod}</span>
                                            <span className="px-2 py-0.5 bg-slate-50 rounded text-[8px] font-bold text-slate-500 uppercase">{t.durum}</span>
                                        </div>
                                        <h3 className="text-xs font-bold text-slate-700 uppercase leading-snug mb-1">{t.konu}</h3>
                                        <p className="text-[10px] text-slate-400 truncate">{t.ilgiliKisi.adSoyad}</p>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* RFQs */}
                    {results.rfqs.length > 0 && (
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-2 px-1">
                                <span className="text-lg">📨</span>
                                <h2 className="font-bold text-slate-800 uppercase tracking-widest text-[11px]">Teklif İstemleri ({results.rfqs.length})</h2>
                            </div>
                            <div className="flex flex-col gap-3">
                                {results.rfqs.map((r: any) => (
                                    <a key={r.id} href={`/rfq/${r.id}`} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all group">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="font-mono text-[10px] font-bold text-slate-400 group-hover:text-indigo-500">{r.rfqNo}</span>
                                            <span className="px-2 py-0.5 bg-indigo-50 rounded text-[8px] font-bold text-indigo-500 uppercase">{r.durum}</span>
                                        </div>
                                        <h3 className="text-xs font-bold text-slate-700 uppercase leading-snug mb-1">{r.baslik}</h3>
                                        <p className="text-[10px] text-slate-400 truncate">{r.olusturan.adSoyad}</p>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Siparişler */}
                    {results.siparisler.length > 0 && (
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-2 px-1">
                                <span className="text-lg">⚙️</span>
                                <h2 className="font-bold text-slate-800 uppercase tracking-widest text-[11px]">Sipariş Süreçleri ({results.siparisler.length})</h2>
                            </div>
                            <div className="flex flex-col gap-3">
                                {results.siparisler.map((s: any) => (
                                    <a key={s.id} href="/siparisler" className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all group">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="font-mono text-[10px] font-bold text-slate-400 group-hover:text-indigo-500">{s.barkod}</span>
                                            <span className="px-2 py-0.5 bg-emerald-50 rounded text-[8px] font-bold text-emerald-500 uppercase">AKTİF</span>
                                        </div>
                                        <h3 className="text-xs font-bold text-slate-700 uppercase leading-snug mb-1">
                                            {s.talep?.konu || 'SİPARİŞ KAYDI'}
                                        </h3>
                                        <p className="text-[10px] text-slate-400 truncate">{s.tedarikci?.ad || 'TEDARİKÇİ BELİRTİLMEMİŞ'}</p>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Tedarikçiler (Firmalar) */}
                    {results.tedarikciler?.length > 0 && (
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-2 px-1">
                                <span className="text-lg">🏢</span>
                                <h2 className="font-bold text-slate-800 uppercase tracking-widest text-[11px]">Tedarikçi Firmalar ({results.tedarikciler.length})</h2>
                            </div>
                            <div className="flex flex-col gap-3">
                                {results.tedarikciler.map((t: any) => (
                                    <a key={t.id} href={`/tedarikciler/${t.id}`} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:border-amber-100 transition-all group">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="font-mono text-[10px] font-bold text-slate-400 group-hover:text-amber-500">{t.vergiNo || 'VERGİ NO YOK'}</span>
                                            <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${t.aktif ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
                                                {t.aktif ? 'AKTİF' : 'PASİF'}
                                            </span>
                                        </div>
                                        <h3 className="text-xs font-bold text-slate-700 uppercase leading-snug mb-1">{t.ad}</h3>
                                        <p className="text-[10px] text-slate-400 truncate">{t.yetkiliKisi || t.email || 'İLETİŞİM BİLGİSİ YOK'}</p>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Sözleşmeler */}
                    {results.sozlesmeler?.length > 0 && (
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-2 px-1">
                                <span className="text-lg">📄</span>
                                <h2 className="font-bold text-slate-800 uppercase tracking-widest text-[11px]">Sözleşmeler ({results.sozlesmeler.length})</h2>
                            </div>
                            <div className="flex flex-col gap-3">
                                {results.sozlesmeler.map((s: any) => (
                                    <a key={s.id} href="/sozlesmeler" className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:border-violet-100 transition-all group">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="font-mono text-[10px] font-bold text-slate-400 group-hover:text-violet-500">{s.sozlesmeNo}</span>
                                            <span className="px-2 py-0.5 bg-violet-50 rounded text-[8px] font-bold text-violet-500 uppercase">SÖZLEŞME</span>
                                        </div>
                                        <h3 className="text-xs font-bold text-slate-700 uppercase leading-snug mb-1">
                                            {s.siparis?.tedarikci?.ad || 'TEDARİKÇİ BELİRTİLMEMİŞ'}
                                        </h3>
                                        <p className="text-[10px] text-slate-400 truncate">
                                            {new Date(s.baslangicTarihi).toLocaleDateString('tr-TR')} - {new Date(s.bitisTarihi).toLocaleDateString('tr-TR')}
                                        </p>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Faturalar (Finansal Kayıtlar) */}
                    {results.faturalar?.length > 0 && (
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-2 px-1">
                                <span className="text-lg">💰</span>
                                <h2 className="font-bold text-slate-800 uppercase tracking-widest text-[11px]">Finansal Kayıtlar ({results.faturalar.length})</h2>
                            </div>
                            <div className="flex flex-col gap-3">
                                {results.faturalar.map((f: any) => (
                                    <a key={f.id} href="/finans" className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:border-teal-100 transition-all group">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="font-mono text-[10px] font-bold text-slate-400 group-hover:text-teal-500">{f.faturaNo}</span>
                                            <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${f.odemeDurumu === 'ODENDI' ? 'bg-emerald-50 text-emerald-500' : 'bg-amber-50 text-amber-500'}`}>
                                                {f.odemeDurumu}
                                            </span>
                                        </div>
                                        <h3 className="text-xs font-bold text-slate-700 uppercase leading-snug mb-1">
                                            {Number(f.tutar).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                                        </h3>
                                        <p className="text-[10px] text-slate-400 truncate">
                                            Vade: {new Date(f.vadeTarihi).toLocaleDateString('tr-TR')} • {f.siparis?.tedarikci?.ad || 'TEDARİKÇİ'}
                                        </p>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default function AramaPage() {
    return (
        <Suspense fallback={<div>Yükleniyor...</div>}>
            <AramaSonuclari />
        </Suspense>
    )
}
