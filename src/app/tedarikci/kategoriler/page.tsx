'use client'

import { useState, useEffect, useMemo } from 'react'
import {
    getTedarikciKategorileri,
    createTedarikciKategori,
    updateTedarikciKategori,
    deleteTedarikciKategori
} from '@/lib/actions'
import { useNotification } from '@/context/NotificationContext'
import { Pagination } from '@/components/Pagination'

export default function TedarikciKategorileriPage() {
    const [categories, setCategories] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const { showAlert, showConfirm } = useNotification()

    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
    const [showModal, setShowModal] = useState(false)
    const [editingId, setEditingId] = useState<number | null>(null)
    const [formData, setFormData] = useState({ ad: '', aciklama: '' })

    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 20

    useEffect(() => {
        fetchCategories()
    }, [])

    async function fetchCategories() {
        setLoading(true)
        try {
            const tk = await getTedarikciKategorileri()
            setCategories(tk)
        } catch (err) {
            console.error(err)
            showAlert('Kategoriler çekilemedi', 'error')
        } finally {
            setLoading(false)
        }
    }

    const filteredCategories = useMemo(() => {
        return categories.filter(c =>
            c.ad.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (c.aciklama && c.aciklama.toLowerCase().includes(searchTerm.toLowerCase()))
        )
    }, [categories, searchTerm])

    const paginatedCategories = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage
        return filteredCategories.slice(startIndex, startIndex + itemsPerPage)
    }, [filteredCategories, currentPage])

    const totalPages = Math.ceil(filteredCategories.length / itemsPerPage)

    const openModal = (mode: 'create' | 'edit', item?: any) => {
        setModalMode(mode)
        if (mode === 'edit' && item) {
            setEditingId(item.id)
            setFormData({ ad: item.ad, aciklama: item.aciklama || '' })
        } else {
            setEditingId(null)
            setFormData({ ad: '', aciklama: '' })
        }
        setShowModal(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            if (modalMode === 'create') {
                await createTedarikciKategori(formData.ad, formData.aciklama)
            } else if (editingId !== null) {
                await updateTedarikciKategori(editingId, formData.ad, formData.aciklama)
            }
            setShowModal(false)
            fetchCategories()
            showAlert('Kategori başarıyla kaydedildi', 'success')
        } catch (err) {
            showAlert('Hata: ' + (err as Error).message, 'error')
        }
    }

    const handleDelete = async (id: number) => {
        const confirmed = await showConfirm('Bu kategoriyi silmek istediğinize emin misiniz?')
        if (!confirmed) return
        try {
            await deleteTedarikciKategori(id)
            fetchCategories()
            showAlert('Kategori başarıyla silindi', 'success')
        } catch (err) {
            showAlert('Hata: ' + (err as Error).message, 'error')
        }
    }

    return (
        <div className="flex flex-col gap-6 animate-in">
            {/* Page Header */}
            <div className="flex justify-between items-end border-b border-slate-200 pb-5">
                <div>
                    <h2 className="text-[15px] font-medium text-slate-800 uppercase tracking-widest">Tedarikçi Kategorileri</h2>
                    <p className="text-[9px] text-slate-500 font-medium mt-0.5 uppercase tracking-tighter">Sektörel ve Hizmet Bazlı Gruplandırma</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative w-64">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
                        <input
                            type="text"
                            placeholder="Kategorilerde ara..."
                            className="w-full bg-white border border-slate-200 pl-10 pr-4 py-2 rounded-lg text-[12px] outline-none focus:border-slate-400 transition-all"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value)
                                setCurrentPage(1)
                            }}
                        />
                    </div>
                    <button
                        onClick={() => openModal('create')}
                        className="bg-slate-800 text-white px-4 py-2 rounded text-[11px] font-bold hover:bg-slate-900 transition-all shadow-md uppercase tracking-widest"
                    >
                        Yeni Kategori Ekle
                    </button>
                </div>
            </div>

            <div className="premium-card overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] uppercase font-medium tracking-widest">
                        <tr>
                            <th className="px-5 py-3">Kategori Adı</th>
                            <th className="px-5 py-3">Açıklama</th>
                            <th className="px-5 py-3 text-right">İşlemler</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan={3} className="px-5 py-10 text-center uppercase tracking-widest text-[10px] text-slate-400 font-medium">Veriler İşleniyor...</td></tr>
                        ) : paginatedCategories.length === 0 ? (
                            <tr><td colSpan={3} className="px-5 py-10 text-center text-slate-300 text-[10px] uppercase tracking-widest font-medium italic">Kayıtlı kategori bulunamadı.</td></tr>
                        ) : (
                            paginatedCategories.map((tk: any) => (
                                <tr key={tk.id} className="hover:bg-slate-50/50 transition-colors group text-[12px] font-medium text-slate-600">
                                    <td className="px-5 py-3 text-slate-800 uppercase tracking-tighter font-bold">{tk.ad}</td>
                                    <td className="px-5 py-3 text-slate-500">{tk.aciklama || '-'}</td>
                                    <td className="px-5 py-3 text-right opacity-30 group-hover:opacity-100 transition-opacity">
                                        <div className="flex justify-end gap-3 text-[10px] uppercase font-bold">
                                            <button onClick={() => openModal('edit', tk)} className="text-slate-700 hover:text-slate-950 border-b border-slate-200 hover:border-slate-800 pb-0.5 px-1 hover:bg-slate-50 rounded transition-all">Düzenle</button>
                                            <button onClick={() => handleDelete(tk.id)} className="text-rose-600 hover:text-rose-800 border-b border-rose-100 hover:border-rose-600 pb-0.5 px-1 hover:bg-rose-50 rounded transition-all">Sil</button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="scale-90 origin-right pr-4">
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    totalItems={filteredCategories.length}
                    itemsPerPage={itemsPerPage}
                />
            </div>

            {/* MODAL */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
                    <div className="bg-white rounded w-full max-w-sm shadow-xl border border-slate-200">
                        <div className="p-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center rounded-t text-[11px] font-medium text-slate-700 uppercase tracking-widest">
                            {modalMode === 'create' ? 'Yeni Kategori Girişi' : 'Kategori Güncelleme'}
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">×</button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-3">
                            <div className="flex flex-col gap-0.5">
                                <label className="text-[9px] font-medium text-slate-400 uppercase ml-1">Kategori Adı</label>
                                <input
                                    required
                                    className="bg-white border border-slate-200 p-1.5 rounded text-[11px] font-medium outline-none focus:border-slate-400"
                                    value={formData.ad}
                                    onChange={e => setFormData({ ...formData, ad: e.target.value })}
                                />
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <label className="text-[9px] font-medium text-slate-400 uppercase ml-1">Açıklama</label>
                                <textarea
                                    rows={3}
                                    className="bg-white border border-slate-200 p-1.5 rounded text-[11px] font-medium outline-none focus:border-slate-400 resize-none"
                                    value={formData.aciklama}
                                    onChange={e => setFormData({ ...formData, aciklama: e.target.value })}
                                />
                            </div>
                            <div className="flex justify-end gap-2 mt-2">
                                <button type="button" onClick={() => setShowModal(false)} className="px-3 py-1.5 text-[10px] font-medium text-slate-400 uppercase">İptal</button>
                                <button type="submit" className="bg-slate-700 text-white px-5 py-1.5 rounded text-[10px] font-medium hover:bg-slate-800 uppercase tracking-widest">
                                    {modalMode === 'create' ? 'Kaydet' : 'Güncelle'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
