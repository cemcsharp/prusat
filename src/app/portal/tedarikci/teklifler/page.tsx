'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { getSupplierOffers } from '@/lib/portalActions'
import Link from 'next/link'

export default function SupplierTekliflerPage() {
    const { data: session } = useSession()
    const [offers, setOffers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'aktif' | 'pasif'>('aktif')

    useEffect(() => {
        if (session?.user?.tedarikciId) {
            fetchOffers()
        }
    }, [session])

    async function fetchOffers() {
        setLoading(true)
        try {
            const data = await getSupplierOffers(Number(session?.user?.tedarikciId))
            setOffers(data)
        } catch (error) {
            console.error('Teklifler yüklenirken hata:', error)
        } finally {
            setLoading(false)
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'GÖNDERİLDİ': return <span className="px-3 py-1 bg-sky-100 text-sky-700 text-[10px] font-black rounded-full border border-sky-200 uppercase">Gönderildi</span>
            case 'IP_LISTESINDE': return <span className="px-3 py-1 bg-amber-100 text-amber-700 text-[10px] font-black rounded-full border border-amber-200 uppercase">Kısa Listede</span>
            case 'SEÇİLDİ': return <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-full border border-emerald-200 uppercase">Sipariş Hazırlanıyor</span>
            case 'ELENDİ': return <span className="px-3 py-1 bg-slate-100 text-slate-500 text-[10px] font-black rounded-full border border-slate-200 uppercase">Elendi</span>
            case 'RESERVE': return <span className="px-3 py-1 bg-purple-100 text-purple-700 text-[10px] font-black rounded-full border border-purple-200 uppercase">Yedek</span>
            default: return <span className="px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-black rounded-full border border-slate-200 uppercase">{status}</span>
        }
    }

    const now = new Date()
    const filteredOffers = offers.filter(offer => {
        const isExpired = offer.rfq?.sonTeklifTarihi ? new Date(offer.rfq.sonTeklifTarihi) < now : false
        const isPassiveStatus = offer.rfq?.durum === 'TAMAMLANDI' || offer.rfq?.durum === 'IPTAL'

        if (activeTab === 'aktif') {
            return !isPassiveStatus && !isExpired
        } else {
            return isPassiveStatus || isExpired
        }
    })

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin text-3xl text-teal-600">⌛</div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm gap-4">
                <div>
                    <h1 className="text-xl font-bold text-slate-800 tracking-tight">Tekliflerim</h1>
                    <p className="text-sm text-slate-500">Gönderdiğiniz tüm tekliflerin durumu ve geçmişi</p>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-xl w-full md:w-fit">
                    <button
                        onClick={() => setActiveTab('aktif')}
                        className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'aktif'
                                ? 'bg-white text-teal-600 shadow-sm'
                                : 'text-slate-400 hover:text-slate-600'
                            }`}
                    >
                        Aktif Teklifler ({offers.filter(o => {
                            const isExpired = o.rfq?.sonTeklifTarihi ? new Date(o.rfq.sonTeklifTarihi) < now : false
                            const isPassiveStatus = o.rfq?.durum === 'TAMAMLANDI' || o.rfq?.durum === 'IPTAL'
                            return !isPassiveStatus && !isExpired
                        }).length})
                    </button>
                    <button
                        onClick={() => setActiveTab('pasif')}
                        className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'pasif'
                                ? 'bg-white text-slate-600 shadow-sm'
                                : 'text-slate-400 hover:text-slate-600'
                            }`}
                    >
                        Geçmiş / Pasif ({offers.filter(o => {
                            const isExpired = o.rfq?.sonTeklifTarihi ? new Date(o.rfq.sonTeklifTarihi) < now : false
                            const isPassiveStatus = o.rfq?.durum === 'TAMAMLANDI' || o.rfq?.durum === 'IPTAL'
                            return isPassiveStatus || isExpired
                        }).length})
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">RFQ No / Konu</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Tarih</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Toplam Tutar</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Durum</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">İşlem</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredOffers.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-20 text-center text-slate-400 italic">
                                    {activeTab === 'aktif' ? 'Aktif bir teklifiniz bulunmuyor.' : 'Geçmiş / pasif teklifiniz bulunmuyor.'}
                                </td>
                            </tr>
                        ) : (
                            filteredOffers.map((offer) => (
                                <tr key={offer.id} className={`hover:bg-slate-50/50 transition-colors group ${activeTab === 'pasif' ? 'opacity-70' : ''}`}>
                                    <td className="px-6 py-4">
                                        <div className={`font-bold tracking-tight transition-colors ${activeTab === 'aktif' ? 'text-slate-800 group-hover:text-teal-600' : 'text-slate-500'}`}>
                                            {offer.rfq?.rfqNo || `RFQ-${offer.rfqId}`}
                                        </div>
                                        <div className="text-[11px] text-slate-500 truncate max-w-xs">{offer.talep?.konu || 'Konu belirtilmemiş'}</div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="text-xs font-medium text-slate-600">
                                            {new Date(offer.olusturmaTarihi).toLocaleDateString('tr-TR')}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className={`text-sm font-black ${activeTab === 'aktif' ? 'text-slate-900' : 'text-slate-500'}`}>
                                            {Number(offer.toplamTutar).toLocaleString('tr-TR')} ₺
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {getStatusBadge(offer.durum)}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Link
                                            href={`/portal/tedarikci/rfq/${offer.rfqId}`}
                                            className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest shadow-lg ${activeTab === 'aktif'
                                                    ? 'bg-slate-900 hover:bg-teal-600 text-white shadow-slate-200'
                                                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200 shadow-transparent'
                                                }`}
                                        >
                                            {activeTab === 'aktif' ? 'DETAY' : 'İNCELE'}
                                        </Link>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
