import { getReportingData, getPurchaserPerformance, getSupplierPerformanceReport } from '@/lib/actions'
import { ReportClient } from '@/components/ReportClient'

export default async function RaporlarPage() {
    const reportingData = await getReportingData()
    const purchaserPeformance = await getPurchaserPerformance()
    const supplierPerformance = await getSupplierPerformanceReport()

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Raporlama Paneli</h2>
                    <p className="text-slate-500 text-sm mt-1">Sistem genelindeki satınalma performansı ve harcama analizi.</p>
                </div>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-white border border-slate-200 rounded text-[11px] font-bold uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-colors">
                        PDF Dışa Aktar
                    </button>
                    <button className="px-4 py-2 bg-indigo-600 rounded text-[11px] font-bold uppercase tracking-widest text-white hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100">
                        Excel İndir
                    </button>
                </div>
            </div>

            <ReportClient
                initialData={reportingData}
                purchasers={purchaserPeformance}
                suppliers={supplierPerformance}
            />
        </div>
    )
}
