'use client'

import { useState, useEffect } from 'react'
import { getAnalyticsData } from '@/lib/actions'
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts'

const COLORS = ['#0f172a', '#334155', '#64748b', '#94a3b8', '#cbd5e1'];

export function AnalyticsCharts() {
    const [data, setData] = useState<{
        spendingTrend: any[],
        birimDistribution: any[],
        savingsPerformance: any[]
    }>({
        spendingTrend: [],
        birimDistribution: [],
        savingsPerformance: []
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await getAnalyticsData()
                setData(res)
            } catch (err) {
                console.error('Analitik verileri yüklenemedi:', err)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
                {[1, 2, 3].map(i => (
                    <div key={i} className="premium-card p-5 h-64 bg-slate-50/50"></div>
                ))}
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Trend Chart (Area with Gradient) */}
            <div className="premium-card p-5 lg:col-span-2">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-[12px] font-medium text-slate-700 uppercase tracking-widest">Harcama Trendi (Aylık)</h3>
                    <span className="text-[9px] text-slate-500 uppercase font-medium shadow-sm px-2 py-0.5 border border-slate-100 rounded">₺ Toplam Tutar</span>
                </div>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data.spendingTrend}>
                            <defs>
                                <linearGradient id="colorTutar" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#0f172a" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#0f172a" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 9, fontWeight: 500, fill: '#64748b' }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 9, fontWeight: 500, fill: '#64748b' }}
                                tickFormatter={(val) => `₺${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}`}
                            />
                            <Tooltip
                                contentStyle={{
                                    borderRadius: '12px',
                                    border: '1px solid rgba(255,255,255,0.8)',
                                    background: 'rgba(255, 255, 255, 0.95)',
                                    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
                                    fontSize: '11px',
                                    padding: '12px'
                                }}
                                formatter={(value: any) => [new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(value), 'Harcama']}
                                cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                            />
                            <Line
                                type="monotone"
                                dataKey="tutar"
                                stroke="#0f172a"
                                strokeWidth={2.5}
                                dot={{ r: 4, fill: '#0f172a', strokeWidth: 2, stroke: '#fff' }}
                                activeDot={{ r: 6, strokeWidth: 0, fill: '#0ea5e9' }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Savings Performance (Modern Bar) */}
            <div className="premium-card p-5">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-[12px] font-medium text-slate-700 uppercase tracking-widest">Pazarlık Başarısı</h3>
                    <span className="text-[9px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase font-bold">% Tasarruf</span>
                </div>
                <div className="h-64 w-full">
                    {data.savingsPerformance.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.savingsPerformance} layout="vertical" barSize={16}>
                                <CartesianGrid horizontal={false} stroke="#f1f5f9" />
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 9, fontWeight: 600, fill: '#475569' }}
                                    width={80}
                                />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '10px' }}
                                    formatter={(v) => [`%${v}`, 'Tasarruf Oranı']}
                                />
                                <Bar dataKey="oran" radius={[0, 4, 4, 0]}>
                                    {data.savingsPerformance.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.oran > 20 ? '#10b981' : '#3b82f6'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center p-6 text-center border-2 border-dashed border-slate-100 rounded-xl">
                            <span className="text-2xl mb-2">📉</span>
                            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-medium">Henüz tamamlanmış ihale verisi bulunmuyor</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Birim Distribution (Donut Chart) */}
            <div className="premium-card p-5 lg:col-span-1">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-[12px] font-medium text-slate-700 uppercase tracking-widest">Birim Yoğunluğu</h3>
                    <span className="text-[9px] text-slate-400 uppercase">Sipariş Adedi</span>
                </div>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data.birimDistribution}
                                cx="50%"
                                cy="50%"
                                innerRadius={70}
                                outerRadius={85}
                                paddingAngle={4}
                                dataKey="value"
                                cornerRadius={4}
                                stroke="none"
                            >
                                {data.birimDistribution.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px' }}
                            />
                            <Legend
                                iconType="circle"
                                layout="vertical"
                                verticalAlign="middle"
                                align="right"
                                wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase', right: 0 }}
                                formatter={(value, entry: any) => <span className="text-slate-500 font-medium ml-1">{value} ({entry.payload.value})</span>}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="premium-card p-6 lg:col-span-2 bg-gradient-to-r from-slate-900 to-slate-800 border-none shadow-2xl shadow-slate-200/50 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-colors"></div>
                <div className="flex items-center gap-3 mb-3 relative z-10">
                    <div className="relative">
                        <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse"></div>
                        <div className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-75"></div>
                    </div>
                    <span className="text-[10px] text-emerald-400 uppercase tracking-[0.2em] font-bold">Yapay Zeka Destekli Analiz</span>
                </div>
                <p className="text-slate-300 text-[13px] leading-relaxed font-light relative z-10">
                    Sistem verilerine göre, genel satınalma operasyonlarındaki ortalama pazarlık başarınız <span className="text-white font-semibold text-lg mx-1">
                        %{data.savingsPerformance.length > 0 ? Math.round(data.savingsPerformance.reduce((acc, s) => acc + s.oran, 0) / data.savingsPerformance.length) : '0'}
                    </span> seviyesindedir.
                    {data.savingsPerformance.length > 0 && Math.round(data.savingsPerformance.reduce((acc, s) => acc + s.oran, 0) / data.savingsPerformance.length) > 10
                        ? " Bu oran sektör ortalamasının üzerindedir, stratejiniz başarılı görünüyor."
                        : " Tedarikçi havuzunu genişleterek rekabeti artırmanız önerilir."}
                </p>
            </div>
        </div>
    )
}
