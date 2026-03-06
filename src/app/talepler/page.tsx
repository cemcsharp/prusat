'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getTalepler, getPersoneller, getBirimler, createTalep, updateTalepStatus, updateTalep, deleteTalep, assignTalepToPersonel, finalizeAttachments, getSatinalmaUsers, assignTalep, claimTalep } from '@/lib/actions'
import { Pagination } from '@/components/Pagination'
import { ExportExcelButton } from '@/components/ExportButtons'
import { useNotification } from '@/context/NotificationContext'
import FileUpload from '@/components/FileUpload'
import AttachmentList from '@/components/AttachmentList'
import { useSession } from 'next-auth/react'

export default function TaleplerPage() {
    const router = useRouter()
    const [talepler, setTalepler] = useState<any[]>([])
    const [personeller, setPersoneller] = useState<any[]>([])
    const [birimler, setBirimler] = useState<any[]>([])
    const { showAlert, showConfirm } = useNotification()
    const [showModal, setShowModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [selectedTalep, setSelectedTalep] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [refreshFiles, setRefreshFiles] = useState(0)

    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('ALL')
    const [assignmentFilter, setAssignmentFilter] = useState('ALL') // ALL, MY_TASKS, POOL
    const [satinalmaUsers, setSatinalmaUsers] = useState<any[]>([])
    const { data: session } = useSession()
    const [tempId] = useState(() => Math.floor(Math.random() * 1000000))

    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 20


    const [formData, setFormData] = useState({
        ilgiliKisiId: '',
        birimId: '',
        bildirimEmail: '',
        barkod: '',
        konu: '',
        gerekce: ''
    })
    const [formKalemler, setFormKalemler] = useState<any[]>([{ aciklama: '', miktar: 1, birim: 'ADET' }])

    const filteredTalepler = useMemo(() => {
        return talepler.filter(t => {
            const matchesSearch =
                (t.barkod?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                (t.konu?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                (t.ilgiliKisi?.adSoyad?.toLowerCase() || '').includes(searchTerm.toLowerCase())

            const matchesStatus = statusFilter === 'ALL' || t.durum === statusFilter

            return matchesSearch && matchesStatus
        })
    }, [talepler, searchTerm, statusFilter])

    const paginatedTalepler = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage
        return filteredTalepler.slice(startIndex, startIndex + itemsPerPage)
    }, [filteredTalepler, currentPage, itemsPerPage])

    const totalPages = Math.ceil(filteredTalepler.length / itemsPerPage)

    const exportData = useMemo(() => {
        return talepler.map(t => ({
            Tarih: new Date(t.tarih).toLocaleDateString('tr-TR'),
            Barkod: t.barkod,
            Konu: t.konu,
            Sahibi: t.ilgiliKisi.adSoyad,
            Sorumlu: t.sorumlu?.name || 'Atanmamış',
            Durum: t.durum
        }))
    }, [talepler])

    const satinalmaUserOptions = useMemo(() => {
        return satinalmaUsers.map(u => (
            <option key={u.id} value={u.id}>{u.name}</option>
        ))
    }, [satinalmaUsers])

    useEffect(() => {
        fetchData()
    }, [])

    async function fetchData() {
        setLoading(true)
        try {
            let filter: any = {}
            if (assignmentFilter === 'MY_TASKS') {
                filter = { sorumluId: session?.user?.id }
            } else if (assignmentFilter === 'POOL') {
                filter = { sorumluId: null }
            }

            const [tData, pData, bData, uData] = await Promise.all([
                getTalepler(filter),
                getPersoneller(),
                getBirimler(),
                getSatinalmaUsers()
            ])
            setTalepler(tData)
            setPersoneller(pData)
            setBirimler(bData)
            setSatinalmaUsers(uData)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (session) {
            fetchData()
        }
    }, [assignmentFilter, session])

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        try {
            const talep = await createTalep({
                ...formData,
                ilgiliKisiId: parseInt(formData.ilgiliKisiId),
                birimId: formData.birimId ? parseInt(formData.birimId) : undefined,
                bildirimEmail: formData.bildirimEmail || undefined,
                kalemler: formKalemler
            })

            // Dosyaları kesinleştir
            await finalizeAttachments('TALEP_DRAFT', tempId, 'TALEP', talep.id)

            setShowModal(false)
            setFormData({ ilgiliKisiId: '', birimId: '', bildirimEmail: '', barkod: '', konu: '', gerekce: '' })
            setFormKalemler([{ aciklama: '', miktar: 1, birim: 'ADET' }])
            fetchData()
        } catch (err) {
            showAlert('Hata oluştu: ' + (err as Error).message, 'error')
        }
    }

    const addKalem = () => setFormKalemler([...formKalemler, { aciklama: '', miktar: 1, birim: 'ADET' }])
    const removeKalem = (index: number) => setFormKalemler(formKalemler.filter((_, i) => i !== index))
    const updateKalem = (index: number, field: string, value: any) => {
        const newKalemler = [...formKalemler]
        newKalemler[index] = { ...newKalemler[index], [field]: value }
        setFormKalemler(newKalemler)
    }

    async function handleStatusUpdate(id: number, status: string) {
        try {
            await updateTalepStatus(id, status)
            fetchData()
        } catch (err) {
            showAlert('Hata: ' + (err as Error).message, 'error')
        }
    }

    async function handleClaim(id: number) {
        try {
            await claimTalep(id)
            showAlert('Talep başarıyla üzerinize alındı.', 'success')
            fetchData()
        } catch (err) {
            showAlert('Hata: ' + (err as Error).message, 'error')
        }
    }

    async function handleAssignment(talepId: number, userId: string) {
        try {
            await assignTalep(talepId, userId === 'NULL' ? null : userId)
            showAlert('Atama işlemi gerçekleştirildi.', 'success')
            fetchData()
        } catch (err) {
            showAlert('Hata: ' + (err as Error).message, 'error')
        }
    }

    async function handleAssign(talepId: number, personelId: string) {
        if (!personelId) return
        try {
            await assignTalepToPersonel(talepId, parseInt(personelId))
            fetchData()
        } catch (err) {
            showAlert('Atama Hatası: ' + (err as Error).message, 'error')
        }
    }

    const [editFormData, setEditFormData] = useState({
        ilgiliKisiId: '',
        barkod: '',
        konu: '',
        gerekce: ''
    })
    const [editFormKalemler, setEditFormKalemler] = useState<any[]>([])

    const addEditKalem = () => setEditFormKalemler([...editFormKalemler, { aciklama: '', miktar: 1, birim: 'ADET' }])
    const removeEditKalem = (index: number) => setEditFormKalemler(editFormKalemler.filter((_, i) => i !== index))
    const updateEditKalem = (index: number, field: string, value: any) => {
        const newKalemler = [...editFormKalemler]
        newKalemler[index] = { ...newKalemler[index], [field]: value }
        setEditFormKalemler(newKalemler)
    }

    function handleView(id: number) {
        router.push(`/talepler/${id}`)
    }

    function handleEdit(talep: any) {
        setSelectedTalep(talep)
        setEditFormData({
            ilgiliKisiId: talep.ilgiliKisiId.toString(),
            barkod: talep.barkod,
            konu: talep.konu,
            gerekce: talep.gerekce
        })
        setEditFormKalemler(talep.kalemler?.map((k: any) => ({
            aciklama: k.aciklama,
            miktar: k.miktar,
            birim: k.birim
        })) || [{ aciklama: '', miktar: 1, birim: 'ADET' }])
        setShowEditModal(true)
    }

    async function handleEditSubmit(e: React.FormEvent) {
        e.preventDefault()
        try {
            await updateTalep(selectedTalep.id, {
                ilgiliKisiId: parseInt(editFormData.ilgiliKisiId),
                barkod: editFormData.barkod,
                konu: editFormData.konu,
                gerekce: editFormData.gerekce,
                kalemler: editFormKalemler
            })
            setShowEditModal(false)
            setSelectedTalep(null)
            fetchData()
        } catch (err) {
            showAlert('Hata: ' + (err as Error).message, 'error')
        }
    }

    async function handleDelete(id: number) {
        const confirmed = await showConfirm('Bu talebi silmek istediğinize emin misiniz?')
        if (confirmed) {
            try {
                await deleteTalep(id)
                fetchData()
                showAlert('Talep başarıyla silindi', 'success')
            } catch (err) {
                showAlert('Hata: ' + (err as Error).message, 'error')
            }
        }
    }

    return (
        <div className="flex flex-col gap-5 animate-in">
            {/* Page Header */}
            <div className="flex justify-between items-end border-b border-slate-200 pb-5">
                <div>
                    <h2 className="text-[15px] font-medium text-slate-800 uppercase tracking-widest">Satın Alma Talep Yönetimi</h2>
                    <p className="text-[9px] text-slate-500 font-medium mt-0.5 uppercase tracking-tighter">İş Akışı ve Onay Sistemi</p>
                </div>
                <div className="flex gap-2">
                    <ExportExcelButton
                        data={exportData}
                        fileName="TalepListesi"
                        sheetName="Talepler"
                    />
                    <button
                        onClick={() => router.push('/talepler/yeni')}
                        className="bg-slate-800 text-white px-4 py-1.5 rounded text-[11px] font-bold hover:bg-slate-900 transition-all shadow-md uppercase tracking-widest"
                    >
                        Yeni Talep Girişi
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-wrap gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <div className="flex gap-2 bg-slate-100 p-1 rounded-lg">
                    <button
                        onClick={() => setAssignmentFilter('ALL')}
                        className={`px-4 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all ${assignmentFilter === 'ALL' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Tümü
                    </button>
                    <button
                        onClick={() => setAssignmentFilter('MY_TASKS')}
                        className={`px-4 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all ${assignmentFilter === 'MY_TASKS' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Taleplerim
                    </button>
                    <button
                        onClick={() => setAssignmentFilter('POOL')}
                        className={`px-4 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all ${assignmentFilter === 'POOL' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Havuz
                    </button>
                </div>
                <div className="flex-1 min-w-[200px]">
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
                        <input
                            type="text"
                            placeholder="Talep No, Konu veya Sahibi ile ara..."
                            className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-2 rounded-lg text-[12px] outline-none focus:border-slate-400 focus:bg-white transition-all"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value)
                                setCurrentPage(1)
                            }}
                        />
                    </div>
                </div>
                <div className="w-40">
                    <select
                        className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-[12px] outline-none focus:border-slate-400"
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value)
                            setCurrentPage(1)
                        }}
                    >
                        <option value="ALL">Tüm Durumlar</option>
                        <option value="TASLAK">Taslak</option>
                        <option value="ONAY_BEKLIYOR">Onay Bekliyor</option>
                        <option value="ONAYLANDI">Onaylandı</option>
                        <option value="SIPARISE_DONUSTU">Siparişe Dönüştü</option>
                        <option value="IPTAL">İptal</option>
                    </select>
                </div>
            </div>

            {/* List Table */}
            <div className="premium-card overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-[10px] uppercase tracking-widest font-bold">
                        <tr>
                            <th className="px-5 py-3">Tarih</th>
                            <th className="px-5 py-3">Barkod No</th>
                            <th className="px-5 py-3">Talep Konusu</th>
                            <th className="px-5 py-3">Talep Sahibi</th>
                            <th className="px-5 py-3 text-center">Durum</th>
                            <th className="px-5 py-3">Sorumlu</th>
                            <th className="px-5 py-3 text-right">Aksiyonlar</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan={7} className="px-5 py-10 text-center uppercase tracking-widest text-[10px] text-slate-600 font-bold animate-pulse">Veri İşleniyor...</td></tr>
                        ) : paginatedTalepler.length === 0 ? (
                            <tr><td colSpan={7} className="px-5 py-10 text-center text-slate-500 text-[10px] uppercase tracking-widest">Arama kriterlerine uygun kayıt bulunamadı.</td></tr>
                        ) : paginatedTalepler.map((talep: any) => (
                            <tr key={talep.id} className="hover:bg-slate-50 transition-colors duration-150 group text-[12px] font-medium text-slate-600">
                                <td className="px-5 py-3">
                                    {new Date(talep.tarih).toLocaleDateString('tr-TR')}
                                </td>
                                <td className="px-5 py-3 text-slate-800 uppercase">{talep.barkod}</td>
                                <td className="px-5 py-3 uppercase tracking-tighter">{talep.konu}</td>
                                <td className="px-5 py-3">{talep.ilgiliKisi.adSoyad}</td>
                                <td className="px-5 py-3">
                                    <span className={`px-2 py-0.5 rounded text-[9px] border uppercase tracking-tighter ${talep.durum === 'TASLAK' ? 'bg-slate-50 text-slate-500 border-slate-100' :
                                        talep.durum === 'SIPARISE_DONUSTU' ? 'text-emerald-700 font-bold bg-emerald-100/80 border-emerald-200 shadow-sm px-2 py-0.5 rounded text-[9px] border uppercase tracking-tighter' :
                                            talep.durum === 'IPTAL' ? 'text-rose-700 font-bold bg-rose-100/80 border-rose-200 shadow-sm px-2 py-0.5 rounded text-[9px] border uppercase tracking-tighter' :
                                                'text-sky-700 font-bold bg-sky-100/80 border-sky-200 shadow-sm px-2 py-0.5 rounded text-[9px] border uppercase tracking-tighter'
                                        }`}>
                                        {talep.durum.replace('_', ' ')}
                                    </span>
                                </td>
                                <td className="px-5 py-3">
                                    {(session?.user?.role === 'ADMIN' || session?.user?.role === 'SATINALMA') ? (
                                        <select
                                            className="bg-transparent border-0 text-[10px] font-bold text-slate-700 uppercase outline-none cursor-pointer hover:bg-slate-100 p-1 rounded"
                                            value={talep.sorumluId || 'NULL'}
                                            onChange={(e) => handleAssignment(talep.id, e.target.value)}
                                        >
                                            <option value="NULL">Atanmamış</option>
                                            {satinalmaUserOptions}
                                        </select>
                                    ) : (
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                                            {talep.sorumlu?.name || 'Atanmamış'}
                                        </span>
                                    )}
                                </td>
                                <td className="px-5 py-3 text-right group-hover:bg-slate-50/50 transition-all border-l border-slate-100 opacity-90 group-hover:opacity-100">
                                    <div className="flex gap-2 justify-end">
                                        {(!talep.sorumluId && session?.user?.role === 'SATINALMA') && (
                                            <button onClick={() => handleClaim(talep.id)} className="bg-emerald-600 text-white text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-sm">Üstlen</button>
                                        )}
                                        <Link href={`/talepler/${talep.id}`} className="text-[10px] font-bold text-slate-700 hover:text-slate-900 uppercase border-b border-slate-200 hover:border-slate-800 pb-0.5 px-1 hover:bg-slate-50 rounded transition-all">İncele</Link>
                                        {talep.durum !== 'SIPARISE_DONUSTU' && (
                                            <>
                                                <button onClick={() => handleEdit(talep)} className="text-[10px] font-bold text-slate-700 hover:text-slate-900 uppercase border-b border-slate-200 hover:border-slate-800 pb-0.5 px-1 hover:bg-slate-50 rounded transition-all">Düzenle</button>
                                                <button onClick={() => handleDelete(talep.id)} className="text-[10px] text-rose-600 font-bold uppercase border-b border-rose-200 hover:border-rose-600 pb-0.5 px-1 hover:bg-rose-50 rounded transition-all">Sil</button>
                                            </>
                                        )}
                                        {(talep.durum === 'TASLAK' || talep.durum === 'ONAY_BEKLIYOR') && (
                                            <button onClick={() => handleStatusUpdate(talep.id, 'ONAYLANDI')} className="text-[10px] text-emerald-600 uppercase border-b border-transparent hover:border-emerald-600">Onaya Al</button>
                                        )}
                                        {talep.durum === 'ONAYLANDI' && (
                                            <a href={`/siparisler/yeni?talepId=${talep.id}`} className="text-[10px] text-slate-800 uppercase border-b border-transparent hover:border-slate-800">Sipariş İşle</a>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={filteredTalepler.length}
                itemsPerPage={itemsPerPage}
            />

            {/* MODALS */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded w-full max-w-sm shadow-xl border border-slate-200">
                        <div className="p-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center rounded-t text-[10px] font-medium text-slate-700 uppercase">
                            Yeni Veri Kaydı
                            <button onClick={() => setShowModal(false)} className="text-slate-300 hover:text-slate-500">×</button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex flex-col gap-0.5">
                                    <label className="text-[9px] font-medium text-slate-400 uppercase ml-1">İşlem Sahibi</label>
                                    <select required className="bg-white border border-slate-200 p-1.5 rounded text-[11px] font-medium outline-none shadow-sm focus:border-slate-400" value={formData.ilgiliKisiId} onChange={(e) => setFormData({ ...formData, ilgiliKisiId: e.target.value })}>
                                        <option value="">Seçiniz...</option>
                                        {personeller.map(p => <option key={p.id} value={p.id}>{p.adSoyad}</option>)}
                                    </select>
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <label className="text-[9px] font-medium text-slate-400 uppercase ml-1">Barkod Ref</label>
                                    <input required type="text" className="bg-white border border-slate-200 p-1.5 rounded text-[11px] font-medium outline-none shadow-sm focus:border-slate-400" value={formData.barkod} onChange={(e) => setFormData({ ...formData, barkod: e.target.value })} />
                                </div>
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <label className="text-[9px] font-medium text-slate-400 uppercase ml-1">Konu Başlığı</label>
                                <input required type="text" className="bg-white border border-slate-200 p-1.5 rounded text-[11px] font-medium outline-none shadow-sm focus:border-slate-400" value={formData.konu} onChange={(e) => setFormData({ ...formData, konu: e.target.value })} />
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <label className="text-[9px] font-medium text-slate-400 uppercase ml-1">Talep Gerekçesi</label>
                                <textarea required rows={2} className="bg-white border border-slate-200 p-1.5 rounded text-[11px] font-medium outline-none shadow-sm focus:border-slate-400 resize-none" value={formData.gerekce} onChange={(e) => setFormData({ ...formData, gerekce: e.target.value })} />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex flex-col gap-0.5">
                                    <label className="text-[9px] font-medium text-slate-400 uppercase ml-1">İlgili Birim</label>
                                    <select
                                        required
                                        className="bg-white border border-slate-200 p-1.5 rounded text-[11px] font-medium outline-none shadow-sm focus:border-slate-400"
                                        value={formData.birimId}
                                        onChange={(e) => {
                                            const bId = e.target.value;
                                            const birim = birimler.find(b => b.id.toString() === bId);
                                            setFormData({
                                                ...formData,
                                                birimId: bId,
                                                bildirimEmail: birim?.email || formData.bildirimEmail
                                            });
                                        }}
                                    >
                                        <option value="">Seçiniz...</option>
                                        {birimler.map(b => <option key={b.id} value={b.id}>{b.ad}</option>)}
                                    </select>
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <label className="text-[9px] font-medium text-slate-400 uppercase ml-1">Bildirim Email</label>
                                    <input
                                        required
                                        type="email"
                                        className="bg-white border border-slate-200 p-1.5 rounded text-[11px] font-medium outline-none shadow-sm focus:border-slate-400"
                                        value={formData.bildirimEmail}
                                        onChange={(e) => setFormData({ ...formData, bildirimEmail: e.target.value })}
                                        placeholder="birim@example.com"
                                    />
                                </div>
                            </div>

                            {/* Kalemler Section */}
                            <div className="flex flex-col gap-2 mt-2">
                                <div className="flex justify-between items-center border-b border-slate-100 pb-1">
                                    <label className="text-[9px] font-bold text-slate-500 uppercase">Malzeme / Hizmet Listesi</label>
                                    <button type="button" onClick={addKalem} className="text-[9px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-0.5 rounded font-bold transition-all uppercase">+ Ekle</button>
                                </div>
                                <div className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                                    {formKalemler.map((kalem, idx) => (
                                        <div key={idx} className="flex gap-2 items-start bg-slate-50/50 p-2 rounded border border-slate-100">
                                            <div className="flex-1 flex flex-col gap-1">
                                                <input
                                                    placeholder="Malzeme/İş Açıklaması"
                                                    className="bg-transparent border-b border-slate-200 text-[11px] outline-none focus:border-slate-400"
                                                    value={kalem.aciklama}
                                                    onChange={(e) => updateKalem(idx, 'aciklama', e.target.value)}
                                                    required
                                                />
                                                <div className="flex gap-2">
                                                    <input
                                                        type="number"
                                                        placeholder="Miktar"
                                                        className="w-16 bg-transparent border-b border-slate-200 text-[11px] outline-none focus:border-slate-400 text-center"
                                                        value={kalem.miktar || ''}
                                                        onChange={(e) => updateKalem(idx, 'miktar', e.target.value === '' ? 1 : parseFloat(e.target.value) || 1)}
                                                        required
                                                    />
                                                    <input
                                                        placeholder="Birim"
                                                        className="flex-1 bg-transparent border-b border-slate-200 text-[11px] outline-none focus:border-slate-400"
                                                        value={kalem.birim}
                                                        onChange={(e) => updateKalem(idx, 'birim', e.target.value)}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            {formKalemler.length > 1 && (
                                                <button type="button" onClick={() => removeKalem(idx)} className="text-rose-400 hover:text-rose-600 text-lg">×</button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Dosyalar Section (Yeni Kayıt) */}
                            <div className="border-t border-slate-100 pt-2 mt-1">
                                <label className="text-[9px] font-bold text-slate-500 uppercase ml-1 block mb-1">Döküman Ekle (Opsiyonel)</label>
                                <AttachmentList relatedEntity="TALEP_DRAFT" entityId={tempId} refreshTrigger={refreshFiles} />
                                <div className="mt-2">
                                    <FileUpload
                                        relatedEntity="TALEP_DRAFT"
                                        entityId={tempId}
                                        onSuccess={() => setRefreshFiles(prev => prev + 1)}
                                        label="Dosya Seç veya Sürükle"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 mt-1 py-1 border-t border-slate-100">
                                <button type="button" onClick={() => setShowModal(false)} className="px-3 py-1.5 text-[10px] uppercase font-medium text-slate-400">İptal</button>
                                <button type="submit" className="bg-slate-800 text-white px-5 py-1.5 rounded text-[10px] uppercase font-bold hover:bg-slate-900 shadow-sm transition-all tracking-widest">Talebi Oluştur</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showEditModal && selectedTalep && (
                <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded w-full max-w-sm shadow-xl border border-slate-200">
                        <div className="p-3 border-b border-slate-50 bg-slate-50 flex justify-between items-center rounded-t text-[10px] font-medium text-slate-700 uppercase">
                            Kayıt Güncelleme Modu
                            <button onClick={() => { setShowEditModal(false); setSelectedTalep(null); }} className="text-slate-300 hover:text-slate-500">×</button>
                        </div>
                        <form onSubmit={handleEditSubmit} className="p-4 flex flex-col gap-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex flex-col gap-0.5">
                                    <label className="text-[9px] font-medium text-slate-400 uppercase ml-1">İşlem Sahibi</label>
                                    <select required className="bg-white border border-slate-200 p-1.5 rounded text-[11px] font-medium outline-none" value={editFormData.ilgiliKisiId} onChange={(e) => setEditFormData({ ...editFormData, ilgiliKisiId: e.target.value })}>
                                        <option value="">Seçiniz...</option>
                                        {personeller.map(p => <option key={p.id} value={p.id}>{p.adSoyad}</option>)}
                                    </select>
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <label className="text-[9px] font-medium text-slate-400 uppercase ml-1">Barkod No</label>
                                    <input required type="text" className="bg-white border border-slate-200 p-1.5 rounded text-[11px] font-medium outline-none" value={editFormData.barkod} onChange={(e) => setEditFormData({ ...editFormData, barkod: e.target.value })} />
                                </div>
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <label className="text-[9px] font-medium text-slate-400 uppercase ml-1">Konu</label>
                                <input required type="text" className="bg-white border border-slate-200 p-1.5 rounded text-[11px] font-medium outline-none" value={editFormData.konu} onChange={(e) => setEditFormData({ ...editFormData, konu: e.target.value })} />
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <label className="text-[9px] font-medium text-slate-400 uppercase ml-1">Gerekçe</label>
                                <textarea required rows={2} className="bg-white border border-slate-200 p-1.5 rounded text-[11px] font-medium outline-none resize-none" value={editFormData.gerekce} onChange={(e) => setEditFormData({ ...editFormData, gerekce: e.target.value })} />
                            </div>

                            {/* Kalemler Section (Edit) */}
                            <div className="flex flex-col gap-2 mt-2">
                                <div className="flex justify-between items-center border-b border-slate-100 pb-1">
                                    <label className="text-[9px] font-bold text-slate-500 uppercase">Malzeme / Hizmet Listesi</label>
                                    <button type="button" onClick={addEditKalem} className="text-[9px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-0.5 rounded font-bold transition-all uppercase">+ Ekle</button>
                                </div>
                                <div className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                                    {editFormKalemler.map((kalem, idx) => (
                                        <div key={idx} className="flex gap-2 items-start bg-slate-50/50 p-2 rounded border border-slate-100">
                                            <div className="flex-1 flex flex-col gap-1">
                                                <input
                                                    placeholder="Malzeme/İş Açıklaması"
                                                    className="bg-transparent border-b border-slate-200 text-[11px] outline-none focus:border-slate-400"
                                                    value={kalem.aciklama}
                                                    onChange={(e) => updateEditKalem(idx, 'aciklama', e.target.value)}
                                                    required
                                                />
                                                <div className="flex gap-2">
                                                    <input
                                                        type="number"
                                                        placeholder="Miktar"
                                                        className="w-16 bg-transparent border-b border-slate-200 text-[11px] outline-none focus:border-slate-400 text-center"
                                                        value={kalem.miktar || ''}
                                                        onChange={(e) => updateEditKalem(idx, 'miktar', e.target.value === '' ? 1 : parseFloat(e.target.value) || 1)}
                                                        required
                                                    />
                                                    <input
                                                        placeholder="Birim"
                                                        className="flex-1 bg-transparent border-b border-slate-200 text-[11px] outline-none focus:border-slate-400"
                                                        value={kalem.birim}
                                                        onChange={(e) => updateEditKalem(idx, 'birim', e.target.value)}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            {editFormKalemler.length > 1 && (
                                                <button type="button" onClick={() => removeEditKalem(idx)} className="text-rose-400 hover:text-rose-600 text-lg">×</button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Dosyalar (Edit Modu) */}
                            <div className="border-t border-slate-100 pt-2 mt-1">
                                <label className="text-[9px] font-medium text-slate-400 uppercase ml-1 mb-1 block">Ekli Dokümanlar</label>
                                <AttachmentList relatedEntity="TALEP" entityId={selectedTalep.id} refreshTrigger={refreshFiles} />
                                <div className="mt-2">
                                    <FileUpload
                                        relatedEntity="TALEP"
                                        entityId={selectedTalep.id}
                                        onSuccess={() => setRefreshFiles(prev => prev + 1)}
                                        label="Belge Ekle"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 mt-1">
                                <button type="button" onClick={() => { setShowEditModal(false); setSelectedTalep(null); }} className="px-3 py-1.5 text-[10px] font-medium text-slate-400 uppercase">Vazgeç</button>
                                <button type="submit" className="bg-slate-700 text-white px-4 py-1.5 rounded text-[10px] font-medium hover:bg-slate-800 uppercase">Senkronize Et</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
