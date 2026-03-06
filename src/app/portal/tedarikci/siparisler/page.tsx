'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { getSupplierOrders } from '@/lib/portalActions'
import Link from 'next/link'

export default function SupplierOrdersPage() {
    const { data: session } = useSession()
    const [orders, setOrders] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchData() {
            // @ts-ignore
            if (session?.user?.tedarikciId) {
                // @ts-ignore
                const data = await getSupplierOrders(session.user.tedarikciId)
                setOrders(data)
            }
            setLoading(false)
        }
        fetchData()
    }, [session])

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                    <h1 className="text-xl font-bold text-slate-800">Siparişlerim</h1>
                    <p className="text-sm text-slate-500">Firmanıza iletilen satın alma siparişleri ve durumları</p>
                </div>
                <div className="flex gap-2">
                    <span className="px-3 py-1 bg-teal-50 text-teal-600 text-[10px] font-bold uppercase rounded-full border border-teal-100">
                        {orders.length} Toplam Sipariş
                    </span>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
                    <div className="animate-spin text-3xl mb-4 text-teal-600">⌛</div>
                    <p className="text-slate-500 font-medium tracking-tight">Sipariş verileri yükleniyor...</p>
                </div>
            ) : orders.length === 0 ? (
                <div className="text-center py-24 bg-white rounded-2xl border border-slate-200 shadow-sm">
                    <div className="text-6xl mb-6 opacity-20">📦</div>
                    <h3 className="text-lg font-bold text-slate-700">Henüz bir siparişiniz bulunmuyor</h3>
                    <p className="text-slate-400 text-sm max-w-sm mx-auto mt-2 leading-relaxed">
                        Satın alma süreci tamamlanan talepler sipariş emrine dönüştüğünde burada görünecektir.
                    </p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/80 text-[10px] uppercase font-bold text-slate-400 tracking-widest border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4">Sipariş No</th>
                                <th className="px-6 py-4">Tarih</th>
                                <th className="px-6 py-4">Talep Konusu</th>
                                <th className="px-6 py-4">Tutar</th>
                                <th className="px-6 py-4">Durum</th>
                                <th className="px-6 py-4 text-right">İşlem</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {orders.map(order => (
                                <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <span className="text-xs font-bold text-slate-700 group-hover:text-teal-600 transition-colors">
                                            {order.barkod}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-xs text-slate-500">
                                        {new Date(order.tarih).toLocaleDateString('tr-TR')}
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-xs font-medium text-slate-800 line-clamp-1">
                                            {order.talep?.konu || '-'}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-xs font-black text-slate-900">
                                            {order.teklifKabul
                                                ? `${Number(order.teklifKabul.toplamTutar).toLocaleString('tr-TR')} ${order.teklifKabul.paraBirimi}`
                                                : '0,00 TRY'
                                            }
                                        </p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${order.durum === 'TAMAMLANDI'
                                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                                : order.durum === 'BEKLEMEDE'
                                                    ? 'bg-amber-50 text-amber-600 border border-amber-100'
                                                    : 'bg-slate-50 text-slate-500 border border-slate-200'
                                            }`}>
                                            {order.durum}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Link
                                            href={`/portal/tedarikci/siparisler/${order.id}`}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 text-white text-[10px] font-bold uppercase rounded-lg hover:bg-teal-600 transition-all shadow-lg shadow-slate-200"
                                        >
                                            Detay
                                            <span className="text-xs">→</span>
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
