'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { getSupplierInvoices } from '@/lib/portalActions'

export default function SupplierInvoicesPage() {
    const { data: session } = useSession()
    const [invoices, setInvoices] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchData() {
            // @ts-ignore
            if (session?.user?.tedarikciId) {
                // @ts-ignore
                const data = await getSupplierInvoices(session.user.tedarikciId)
                setInvoices(data)
            }
            setLoading(false)
        }
        fetchData()
    }, [session])

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                    <h1 className="text-xl font-bold text-slate-800 tracking-tight">Faturalarım</h1>
                    <p className="text-sm text-slate-500">Kayıtlı tüm faturalarınız ve ödeme durumları</p>
                </div>
                <div className="flex gap-2">
                    <span className="px-3 py-1 bg-teal-50 text-teal-600 text-[10px] font-bold uppercase rounded-full border border-teal-100">
                        {invoices.length} Fatura
                    </span>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
                    <div className="animate-spin text-3xl mb-4 text-teal-600">⌛</div>
                    <p className="text-slate-500 font-medium">Veriler getiriliyor...</p>
                </div>
            ) : invoices.length === 0 ? (
                <div className="text-center py-24 bg-white rounded-2xl border border-slate-200">
                    <div className="text-6xl mb-6 opacity-20">📑</div>
                    <h3 className="text-lg font-bold text-slate-700 font-inter">Henüz kayıtlı faturanız bulunmuyor</h3>
                    <p className="text-slate-400 text-sm max-w-sm mx-auto mt-2 font-medium">
                        Sipariş detay sayfasından fatura girişi yapabilirsiniz.
                    </p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400 tracking-widest border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4">Fatura No</th>
                                <th className="px-6 py-4">Sipariş</th>
                                <th className="px-6 py-4">Kayıt Tarihi</th>
                                <th className="px-6 py-4">Vade Tarihi</th>
                                <th className="px-6 py-4">Tutar</th>
                                <th className="px-6 py-4">Ödeme Durumu</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {invoices.map(inv => (
                                <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <span className="text-xs font-bold text-slate-700 italic underline decoration-slate-200 underline-offset-4">
                                            {inv.faturaNo}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-[10px] bg-slate-100 px-2 py-1 rounded font-bold text-slate-600 border border-slate-200">
                                            {inv.siparis?.barkod || '-'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-xs text-slate-500">
                                        {new Date(inv.createdAt).toLocaleDateString('tr-TR')}
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className={`text-xs font-bold ${new Date(inv.vadeTarihi) < new Date() ? 'text-rose-600' : 'text-slate-700'
                                            }`}>
                                            {new Date(inv.vadeTarihi).toLocaleDateString('tr-TR')}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-xs font-black text-slate-900 tracking-tight">
                                            {Number(inv.tutar).toLocaleString('tr-TR')} ₺
                                        </p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter shadow-sm border ${inv.odemeDurumu === 'ODENDI'
                                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                : 'bg-amber-50 text-amber-600 border-amber-100'
                                            }`}>
                                            {inv.odemeDurumu}
                                        </span>
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
