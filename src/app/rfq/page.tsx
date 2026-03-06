'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getRFQs, updateRFQStatus } from '@/lib/actions'
import { RfqListPdfButton } from '@/components/ExportButtons'

export default function RFQPage() {
    const [rfqs, setRfqs] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('ALL')

    useEffect(() => {
        fetchData()
    }, [])

    async function fetchData() {
        try {
            const data = await getRFQs()
            setRfqs(data)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const filteredRFQs = rfqs.filter(r => {
        const matchesSearch =
            (r.rfqNo?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (r.baslik?.toLowerCase() || '').includes(searchTerm.toLowerCase())
        const matchesStatus = statusFilter === 'ALL' || r.durum === statusFilter
        return matchesSearch && matchesStatus
    })

    const durumRenk = (durum: string) => {
        switch (durum) {
            case 'TASLAK': return 'bg-slate-100 text-slate-700'
            case 'GONDERILDI': return 'bg-blue-100 text-blue-700'
            case 'DEGERLENDIRILME': return 'bg-amber-100 text-amber-700'
            case 'TAMAMLANDI': return 'bg-emerald-100 text-emerald-700'
            case 'IPTAL': return 'bg-rose-100 text-rose-700'
            default: return 'bg-slate-100 text-slate-700'
        }
    }

    return (
        <div className="flex flex-col gap-5 animate-in">
            {/* Page Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-lg font-bold text-slate-800 tracking-wide">Teklif İstemleri (RFQ)</h1>
                    <p className="text-xs text-slate-400 mt-0.5">Tedarikçilere gönderilen teklif istekleri ve yanıtları</p>
                </div>
                <div className="flex gap-2">
                    <RfqListPdfButton rfqs={filteredRFQs} />
                    <Link
                        href="/rfq/olustur"
                        className="bg-slate-700 text-white px-4 py-2 rounded text-xs font-semibold hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl uppercase tracking-wide"
                    >
                        + Yeni RFQ
                    </Link>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-3 items-center">
                <input
                    type="text"
                    placeholder="RFQ No veya başlık ile ara..."
                    className="bg-white border border-slate-200 p-2 rounded text-xs w-64 outline-none focus:ring-2 focus:ring-slate-300"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <select
                    className="bg-white border border-slate-200 p-2 rounded text-xs outline-none"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                >
                    <option value="ALL">Tüm Durumlar</option>
                    <option value="TASLAK">Taslak</option>
                    <option value="GONDERILDI">Gönderildi</option>
                    <option value="DEGERLENDIRILME">Değerlendirilme</option>
                    <option value="TAMAMLANDI">Tamamlandı</option>
                    <option value="IPTAL">İptal</option>
                </select>
            </div>

            {/* Desktop Table */}
            {loading ? (
                <div className="text-center py-12 text-slate-400">
                    <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-500 rounded-full animate-spin mx-auto mb-2"></div>
                    Yükleniyor...
                </div>
            ) : filteredRFQs.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-slate-100">
                    <div className="text-4xl mb-3">📭</div>
                    <p className="text-slate-500 text-sm">Henüz RFQ bulunmuyor.</p>
                    <Link href="/rfq/olustur" className="text-indigo-600 text-xs mt-2 inline-block hover:underline">
                        İlk RFQ'nuzu oluşturun →
                    </Link>
                </div>
            ) : (
                <>
                    {/* Desktop View */}
                    <div className="hidden md:block bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                    <th className="text-left px-4 py-3 text-slate-500 font-medium uppercase">RFQ No</th>
                                    <th className="text-left px-4 py-3 text-slate-500 font-medium uppercase">Başlık</th>
                                    <th className="text-center px-4 py-3 text-slate-500 font-medium uppercase">Kalemler</th>
                                    <th className="text-center px-4 py-3 text-slate-500 font-medium uppercase">Tedarikçiler</th>
                                    <th className="text-center px-4 py-3 text-slate-500 font-medium uppercase">Teklifler</th>
                                    <th className="text-center px-4 py-3 text-slate-500 font-medium uppercase">Son Tarih</th>
                                    <th className="text-center px-4 py-3 text-slate-500 font-medium uppercase">Durum</th>
                                    <th className="text-right px-4 py-3 text-slate-500 font-medium uppercase">İşlem</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRFQs.map((rfq) => (
                                    <tr key={rfq.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                        <td className="px-4 py-3 font-mono font-bold text-slate-700">{rfq.rfqNo}</td>
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-slate-800">{rfq.baslik}</div>
                                            <div className="text-slate-400 text-[10px]">{rfq.olusturan.adSoyad}</div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold">{rfq.kalemler.length}</span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-bold">{rfq.tedarikciler.length}</span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`px-2 py-0.5 rounded font-bold ${rfq.teklifler.length > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                                {rfq.teklifler.length}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center text-slate-600">
                                            {new Date(rfq.sonTeklifTarihi).toLocaleDateString('tr-TR')}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${durumRenk(rfq.durum)}`}>
                                                {rfq.durum.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <Link
                                                href={`/rfq/${rfq.id}`}
                                                className="text-indigo-600 font-bold uppercase text-[10px] hover:underline"
                                            >
                                                Detay
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile View (Card) */}
                    <div className="md:hidden flex flex-col gap-4">
                        {filteredRFQs.map((rfq) => (
                            <div key={rfq.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col gap-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="text-xs font-mono font-bold text-slate-500 mb-1">{rfq.rfqNo}</div>
                                        <h3 className="font-semibold text-slate-800 text-sm">{rfq.baslik}</h3>
                                        <div className="text-[10px] text-slate-400 mt-0.5">{rfq.olusturan.adSoyad}</div>
                                    </div>
                                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${durumRenk(rfq.durum)}`}>
                                        {rfq.durum.replace('_', ' ')}
                                    </span>
                                </div>

                                <div className="grid grid-cols-3 gap-2 py-2 border-t border-b border-slate-50">
                                    <div className="text-center p-1.5 bg-slate-50 rounded">
                                        <div className="text-[9px] text-slate-400 uppercase font-bold">Kalem</div>
                                        <div className="text-sm font-bold text-slate-700">{rfq.kalemler.length}</div>
                                    </div>
                                    <div className="text-center p-1.5 bg-blue-50/50 rounded">
                                        <div className="text-[9px] text-blue-400 uppercase font-bold">Tedarikçi</div>
                                        <div className="text-sm font-bold text-blue-700">{rfq.tedarikciler.length}</div>
                                    </div>
                                    <div className="text-center p-1.5 bg-emerald-50/50 rounded">
                                        <div className="text-[9px] text-emerald-400 uppercase font-bold">Teklif</div>
                                        <div className="text-sm font-bold text-emerald-700">{rfq.teklifler.length}</div>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center mt-1">
                                    <div className="text-[10px] text-slate-500">
                                        Son Tarih: <span className="font-medium text-slate-700">{new Date(rfq.sonTeklifTarihi).toLocaleDateString('tr-TR')}</span>
                                    </div>
                                    <Link
                                        href={`/rfq/${rfq.id}`}
                                        className="bg-slate-800 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg shadow uppercase tracking-wide"
                                    >
                                        Detayları Gör →
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}
