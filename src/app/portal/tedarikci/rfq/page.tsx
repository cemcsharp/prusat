'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { getSupplierRFQs } from '@/lib/portalActions'
import Link from 'next/link'

export default function TedarikciRFQsPage() {
    const { data: session } = useSession()
    const [rfqs, setRfqs] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'aktif' | 'pasif'>('aktif')

    useEffect(() => {
        async function fetchData() {
            // @ts-ignore
            if (session?.user?.tedarikciId) {
                // @ts-ignore
                const data = await getSupplierRFQs(session.user.tedarikciId)
                setRfqs(data)
            }
            setLoading(false)
        }
        fetchData()
    }, [session])

    const now = new Date()
    const filteredRfqs = rfqs.filter(rfq => {
        const isExpired = new Date(rfq.sonTeklifTarihi) < now
        const isPassiveStatus = rfq.durum === 'TAMAMLANDI' || rfq.durum === 'IPTAL'

        if (activeTab === 'aktif') {
            return !isPassiveStatus && !isExpired
        } else {
            return isPassiveStatus || isExpired
        }
    })

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm gap-4">
                <div>
                    <h1 className="text-xl font-bold text-slate-800 tracking-tight">Teklif İstekleri (RFQ)</h1>
                    <p className="text-sm text-slate-500">Firmanıza atanan teklif toplama süreçleri</p>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-xl w-full md:w-fit">
                    <button
                        onClick={() => setActiveTab('aktif')}
                        className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'aktif'
                                ? 'bg-white text-teal-600 shadow-sm'
                                : 'text-slate-400 hover:text-slate-600'
                            }`}
                    >
                        Aktif İlanlar ({rfqs.filter(r => new Date(r.sonTeklifTarihi) >= now && r.durum !== 'TAMAMLANDI' && r.durum !== 'IPTAL').length})
                    </button>
                    <button
                        onClick={() => setActiveTab('pasif')}
                        className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'pasif'
                                ? 'bg-white text-slate-600 shadow-sm'
                                : 'text-slate-400 hover:text-slate-600'
                            }`}
                    >
                        Geçmiş / Pasif ({rfqs.filter(r => new Date(r.sonTeklifTarihi) < now || r.durum === 'TAMAMLANDI' || r.durum === 'IPTAL').length})
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
                    <div className="animate-spin text-3xl mb-4">⌛</div>
                    <p className="text-slate-500 font-medium">İlanlar yükleniyor...</p>
                </div>
            ) : filteredRfqs.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
                    <div className="text-5xl mb-4 opacity-20">📫</div>
                    <h3 className="text-lg font-bold text-slate-700">İlan bulunamadı</h3>
                    <p className="text-slate-400 text-sm max-w-xs mx-auto mt-2">
                        {activeTab === 'aktif' ? 'Şu an bekleyen aktif bir ilan yok.' : 'Henüz tamamlanmış bir ilan bulunmuyor.'}
                    </p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {filteredRfqs.map(rfq => (
                        <div key={rfq.id} className={`bg-white rounded-2xl border p-6 transition-all shadow-sm hover:shadow-md group ${activeTab === 'aktif' ? 'border-slate-200 hover:border-teal-400' : 'border-slate-100 opacity-80'
                            }`}>
                            <div className="flex flex-col md:flex-row justify-between gap-6">
                                <div className="flex-1 space-y-4">
                                    <div className="flex items-center gap-3">
                                        <span className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded uppercase">
                                            {rfq.rfqNo}
                                        </span>
                                        <h2 className={`text-lg font-bold transition-colors ${activeTab === 'aktif' ? 'text-slate-800 group-hover:text-teal-600' : 'text-slate-500'
                                            }`}>
                                            {rfq.baslik}
                                        </h2>
                                        {rfq.durum === 'TAMAMLANDI' && <span className="bg-emerald-100 text-emerald-700 text-[9px] px-2 py-0.5 rounded-full font-black uppercase">TAMAMLANDI</span>}
                                        {rfq.durum === 'IPTAL' && <span className="bg-rose-100 text-rose-700 text-[9px] px-2 py-0.5 rounded-full font-black uppercase">İPTAL</span>}
                                    </div>

                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                                        <div>
                                            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Kategori</p>
                                            <p className="text-xs text-slate-700 font-medium">{rfq.kategori?.ad || 'Genel'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Son Teklif</p>
                                            <p className={`text-xs font-bold ${activeTab === 'aktif' ? 'text-rose-600' : 'text-slate-400'}`}>
                                                {new Date(rfq.sonTeklifTarihi).toLocaleDateString('tr-TR')}
                                                <span className="text-[10px] ml-1 opacity-70">
                                                    {new Date(rfq.sonTeklifTarihi).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Durum</p>
                                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${rfq.kendiTeklifi
                                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                                : 'bg-amber-50 text-amber-600 border border-amber-100'
                                                }`}>
                                                {rfq.kendiTeklifi ? 'Teklif Verildi' : 'Bekliyor'}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Teklifiniz</p>
                                            <p className="text-xs text-slate-800 font-bold">
                                                {rfq.kendiTeklifi
                                                    ? `${Number(rfq.kendiTeklifi.toplamTutar).toLocaleString('tr-TR')} ${rfq.kendiTeklifi.paraBirimi}`
                                                    : '-'
                                                }
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center">
                                    <Link
                                        href={`/portal/tedarikci/rfq/${rfq.id}`}
                                        className={`w-full md:w-auto px-6 py-3 text-[11px] font-bold uppercase rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 ${activeTab === 'aktif'
                                                ? 'bg-slate-800 text-white hover:bg-teal-600 shadow-slate-200'
                                                : 'bg-slate-100 text-slate-500 hover:bg-slate-200 shadow-transparent'
                                            }`}
                                    >
                                        {activeTab === 'pasif' ? 'İncele' : (rfq.kendiTeklifi ? 'Teklifi Güncelle' : 'Teklif Ver')}
                                        <span>→</span>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
