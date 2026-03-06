'use client'

import { useState } from 'react'

interface ReportClientProps {
    initialData: any
    purchasers: any[]
    suppliers: any[]
}

export function ReportClient({ initialData, purchasers, suppliers }: ReportClientProps) {
    const [data] = useState(initialData)

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY',
            maximumFractionDigits: 0
        }).format(val)
    }

    return (
        <div className="space-y-6 pb-20">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card
                    title="Toplam Harcama"
                    value={formatCurrency(data.kpis.totalSpending)}
                    icon="💰"
                    trend="+12% geçen aya göre"
                    trendColor="text-rose-500"
                />
                <Card
                    title="Kurum Avantajı (Toplam)"
                    value={formatCurrency(data.kpis.totalAdvantage)}
                    icon="✨"
                    trend={`${formatCurrency(data.kpis.totalNegotiatedSavings)} pazarlık + ${formatCurrency(data.kpis.totalCompetitiveSavings)} rekabet`}
                    trendColor="text-emerald-500"
                />
                <Card
                    title="Sipariş Adedi"
                    value={data.kpis.orderCount}
                    icon="📦"
                    trend={`${data.kpis.activeSuppliers} aktif tedarikçi`}
                />
                <Card
                    title="Ortalama Tasarruf"
                    value={`%${((data.kpis.totalAdvantage / (data.kpis.totalSpending + data.kpis.totalAdvantage)) * 100).toFixed(1)}`}
                    icon="📉"
                    trend="Sektör ortalaması üstü"
                    trendColor="text-sky-500"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Dağılım Grafikleri */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="premium-card p-6">
                        <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-6 border-b border-slate-50 pb-4">
                            Harcama Dağılımları
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <DistributionList
                                title="Birim Bazlı"
                                items={data.distributions.units}
                                total={data.kpis.totalSpending}
                            />
                            <DistributionList
                                title="Yönetmelik Maddesi"
                                items={data.distributions.regulations}
                                total={data.kpis.totalSpending}
                            />
                        </div>
                    </div>

                    <div className="premium-card p-6">
                        <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-6 border-b border-slate-50 pb-4">
                            Satınalma Personel Performansı (Pazarlık & Tur Analizi)
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-[9px] text-slate-400 uppercase tracking-widest border-b border-slate-50">
                                        <th className="pb-3 font-bold">Personel</th>
                                        <th className="pb-3 font-bold">Tur Ort. / Sipariş</th>
                                        <th className="pb-3 font-bold">Pazarlık Kazancı</th>
                                        <th className="pb-3 font-bold text-right">Toplam Avantaj</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {purchasers.map((p, i) => (
                                        <tr key={p.id} className="group hover:bg-slate-50/50 transition-colors">
                                            <td className="py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-7 h-7 bg-slate-100 rounded flex items-center justify-center text-[10px] font-bold text-slate-500 border border-slate-200">
                                                        {p.name.split(' ').map((n: string) => n[0]).join('')}
                                                    </div>
                                                    <span className="text-[11px] font-bold text-slate-700">{p.name}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 text-[10px] text-slate-500 font-medium tracking-tighter">
                                                {p.avgRounds.toFixed(1)} Tur / {p.orderCount} Sipariş
                                            </td>
                                            <td className="py-4 text-[11px] text-emerald-600 font-bold">
                                                +{formatCurrency(p.totalNegotiatedSavings)}
                                            </td>
                                            <td className="py-4 text-right">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-[11px] font-bold text-slate-800">{formatCurrency(p.totalAdvantage)}</span>
                                                    <div className="w-20 h-1 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                                                        <div
                                                            className="h-full bg-indigo-500 transition-all duration-1000"
                                                            style={{ width: `${p.advantageRatio}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Yan Panel: Katma Değer Analizi */}
                <div className="space-y-6">
                    <div className="premium-card p-6 bg-gradient-to-br from-indigo-600 to-slate-900 border-none text-white">
                        <h3 className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest mb-6 border-b border-white/10 pb-4">
                            Uygulama Katma Değeri
                        </h3>
                        <div className="space-y-6">
                            <div className="space-y-1">
                                <span className="text-[9px] text-indigo-300 uppercase font-bold">Rekabet Avantajı</span>
                                <div className="text-xl font-bold">{formatCurrency(data.kpis.totalCompetitiveSavings)}</div>
                                <p className="text-[10px] text-indigo-200/70 leading-relaxed italic">
                                    Sistemin sağladığı rekabetçi ortam sayesinde piyasa ortalamasının altında yapılan alımların kümülatif kazancı.
                                </p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[9px] text-indigo-300 uppercase font-bold">Personel Pazarlık Gücü</span>
                                <div className="text-xl font-bold">{formatCurrency(data.kpis.totalNegotiatedSavings)}</div>
                                <p className="text-[10px] text-indigo-200/70 leading-relaxed italic">
                                    Satınalma personelinin tedarikçilerle yaptığı çok turlu pazarlıklar sonucu ilk teklife göre elde edilen ek indirimler.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="premium-card p-6">
                        <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-6 border-b border-slate-50 pb-4">
                            Tedarikçi Verimliliği
                        </h3>
                        <div className="space-y-6">
                            {suppliers.slice(0, 5).map(s => (
                                <div key={s.id} className="flex flex-col gap-2">
                                    <div className="flex justify-between items-start">
                                        <div className="flex flex-col">
                                            <span className="text-[11px] font-bold text-slate-700 truncate max-w-[150px]">{s.name}</span>
                                            <span className="text-[9px] text-slate-400 font-medium uppercase">{s.orderCount} Sipariş</span>
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-900">{formatCurrency(s.totalVolume)}</span>
                                    </div>
                                    <div className="h-1 bg-slate-50 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-slate-400 transition-all"
                                            style={{ width: `${s.advantageRatio}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <p className="text-[10px] text-slate-400 italic mt-6">
                            RFQ süreçlerinin dijitalleşmesi ile işlem hacmi geçen aya göre artış göstermiştir.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

function Card({ title, value, icon, trend, trendColor = 'text-slate-400' }: any) {
    return (
        <div className="premium-card px-5 py-6 flex flex-col gap-4 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:scale-110 transition-transform">
                <span className="text-xl">{icon}</span>
            </div>
            <div className="space-y-1">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{title}</h4>
                <p className="text-2xl font-bold text-slate-800 tracking-tight">{value}</p>
            </div>
            {trend && <p className={`text-[9px] font-bold uppercase tracking-tighter ${trendColor}`}>{trend}</p>}
        </div>
    )
}

function DistributionList({ title, items, total }: any) {
    return (
        <div className="space-y-5">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{title}</h4>
            <div className="space-y-4">
                {items.length === 0 ? (
                    <div className="py-4 text-[10px] text-slate-400 italic">Veri bulunamadı.</div>
                ) : items.map((item: any, i: number) => {
                    const percentage = total > 0 ? (item.value / total) * 100 : 0
                    return (
                        <div key={i} className="space-y-1.5 group">
                            <div className="flex justify-between text-[10px] font-bold uppercase tracking-tighter">
                                <span className="text-slate-600 truncate max-w-[120px] group-hover:text-slate-900 transition-colors">{item.name}</span>
                                <span className="text-slate-400">%{percentage.toFixed(0)}</span>
                            </div>
                            <div className="h-1 bg-slate-50 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-slate-800 transition-all duration-1000 group-hover:bg-indigo-500"
                                    style={{ width: `${percentage}%` }}
                                ></div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
