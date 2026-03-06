'use client'

interface PaginationProps {
    currentPage: number
    totalPages: number
    onPageChange: (page: number) => void
    totalItems: number
    itemsPerPage: number
}

export function Pagination({
    currentPage,
    totalPages,
    onPageChange,
    totalItems,
    itemsPerPage
}: PaginationProps) {
    if (totalPages <= 1) return null

    const startItem = (currentPage - 1) * itemsPerPage + 1
    const endItem = Math.min(currentPage * itemsPerPage, totalItems)

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 px-2">
            <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                Toplam <span className="text-slate-800 font-bold">{totalItems}</span> kayıttan
                <span className="text-slate-800 font-bold"> {startItem}-{endItem} </span>
                arası gösteriliyor
            </div>

            <div className="flex items-center gap-1">
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded border border-slate-200 text-slate-400 hover:text-slate-800 hover:border-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    title="Önceki Sayfa"
                >
                    <span className="text-xs">←</span>
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => {
                        // Basit sayfalama mantığı: ilk, son ve mevcut sayfanın yanındakiler
                        return page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1
                    })
                    .map((page, index, array) => {
                        const showEllipsis = index > 0 && page - array[index - 1] > 1

                        return (
                            <div key={page} className="flex items-center gap-1">
                                {showEllipsis && <span className="text-slate-300 px-1 text-xs">...</span>}
                                <button
                                    onClick={() => onPageChange(page)}
                                    className={`w-8 h-8 rounded text-[11px] font-bold transition-all border ${currentPage === page
                                            ? 'bg-slate-800 text-white border-slate-800 shadow-lg shadow-slate-200'
                                            : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400 hover:text-slate-800'
                                        }`}
                                >
                                    {page}
                                </button>
                            </div>
                        )
                    })}

                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded border border-slate-200 text-slate-400 hover:text-slate-800 hover:border-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    title="Sonraki Sayfa"
                >
                    <span className="text-xs">→</span>
                </button>
            </div>
        </div>
    )
}
