'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { getSupplierProfile, updateTedarikciProfile, getTedarikciKategorileri, updateSupplierCategories } from '@/lib/portalActions'
import { useNotification } from '@/context/NotificationContext'

export default function SupplierProfilePage() {
    const { data: session } = useSession()
    const { showAlert } = useNotification()
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)

    // Profil Data
    const [profile, setProfile] = useState<any>({
        ad: '',
        vergiNo: '',
        vergiDairesi: '',
        telefon: '',
        adres: '',
        yetkiliKisi: '',
        email: ''
    })

    // Category Data
    const [categories, setCategories] = useState<any[]>([])
    const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([])
    const [pendingRequests, setPendingRequests] = useState<any[]>([])

    useEffect(() => {
        async function fetchData() {
            // @ts-ignore
            if (session?.user?.tedarikciId) {
                // @ts-ignore
                const tedarikciId = session.user.tedarikciId

                // Parallel fetch
                const [supplierData, allCategories] = await Promise.all([
                    getSupplierProfile(tedarikciId),
                    getTedarikciKategorileri()
                ])

                if (supplierData) {
                    setProfile(supplierData)
                    // Mevcut kategorileri set et
                    if (supplierData.kategoriler) {
                        setSelectedCategoryIds(supplierData.kategoriler.map((k: any) => k.id))
                    }
                    // Bekleyen istekler
                    if (supplierData.kategoriIstekleri) {
                        setPendingRequests(supplierData.kategoriIstekleri)
                    }
                }
                setCategories(allCategories)
            }
            setLoading(false)
        }
        fetchData()
    }, [session])

    const handleCategoryToggle = (catId: number) => {
        setSelectedCategoryIds(prev =>
            prev.includes(catId)
                ? prev.filter(id => id !== catId)
                : [...prev, catId]
        )
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        // @ts-ignore
        if (!session?.user?.tedarikciId) return

        setSubmitting(true)
        // @ts-ignore
        const tedarikciId = session.user.tedarikciId

        try {
            // 1. Profil bilgilerini güncelle
            const profileResult = await updateTedarikciProfile(tedarikciId, profile)

            // 2. Kategori güncelleme isteği gönder
            const categoryResult = await updateSupplierCategories(tedarikciId, selectedCategoryIds)

            if (profileResult.success && categoryResult.success) {
                showAlert('Firma bilgileri ve kategori tercihleri başarıyla güncellendi.', 'success')

                // Verileri tazelemek için sayfayı yenilemek yerine yeniden fetch edebiliriz ama
                // kullanıcıya anlık geri bildirim yeterli. Bekleyen istekleri manuel ekleyebiliriz UI'a.
                // Basitlik için bekleyen listesini güncellemiyoruz, bir sonraki girişte görünür 
                // ya da alert yeterli.
            } else {
                showAlert('Bazı güncellemeler başarısız oldu.', 'error')
            }
        } catch (error) {
            showAlert('Bir hata oluştu.', 'error')
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) return <div className="p-8 text-center text-slate-500 font-medium tracking-tight">Profil yükleniyor...</div>

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h1 className="text-xl font-bold text-slate-800 tracking-tight">Firma Bilgileri</h1>
                <p className="text-sm text-slate-500">Portal üzerindeki firma profilinizi güncel tutun</p>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-8 space-y-8">
                    {/* Temel Bilgiler */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                            <span className="text-lg">🏢</span>
                            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest">Resmi Bilgiler</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1.5">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Firma Ünvanı</label>
                                <input
                                    type="text"
                                    disabled
                                    value={profile.ad || ''}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-400 cursor-not-allowed"
                                />
                                <p className="text-[10px] text-slate-400">Ünvan değişikliği için satınalma birimi ile iletişime geçin.</p>
                            </div>
                            <div className="space-y-1.5">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Vergi Numarası</label>
                                <input
                                    type="text"
                                    required
                                    value={profile.vergiNo || ''}
                                    onChange={(e) => setProfile({ ...profile, vergiNo: e.target.value })}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:border-teal-500 outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Vergi Dairesi</label>
                                <input
                                    type="text"
                                    required
                                    value={profile.vergiDairesi || ''}
                                    onChange={(e) => setProfile({ ...profile, vergiDairesi: e.target.value })}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:border-teal-500 outline-none transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Kategoriler */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                            <span className="text-lg">🏷️</span>
                            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest">Hizmet Kategorileri</h3>
                        </div>

                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {categories.map((cat) => {
                                    const isSelected = selectedCategoryIds.includes(cat.id)
                                    const isPending = pendingRequests.some(req => req.kategoriId === cat.id)

                                    return (
                                        <label key={cat.id} className={`
                                            flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all
                                            ${isSelected
                                                ? 'bg-white border-green-500 shadow-sm'
                                                : 'bg-transparent border-transparent hover:bg-white hover:border-slate-200'
                                            }
                                        `}>
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => handleCategoryToggle(cat.id)}
                                                className="w-4 h-4 text-green-600 rounded focus:ring-green-500 border-gray-300"
                                            />
                                            <div className="flex-1">
                                                <span className={`text-sm font-medium ${isSelected ? 'text-slate-900' : 'text-slate-600'}`}>
                                                    {cat.ad}
                                                </span>
                                                {isPending && (
                                                    <div className="text-[10px] text-orange-500 font-bold mt-0.5">
                                                        ⚠️ Onay Bekliyor
                                                    </div>
                                                )}
                                            </div>
                                        </label>
                                    )
                                })}
                            </div>
                            <p className="text-[11px] text-slate-400 mt-4 px-1">
                                * Yeni seçtiğiniz kategoriler, yönetici onayından sonra aktif olacaktır. Onay bekleyen seçimler turuncu ile işaretlenmiştir.
                            </p>
                        </div>
                    </div>

                    {/* İletişim Bilgileri */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                            <span className="text-lg">📞</span>
                            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest">İletişim ve Adres</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1.5">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Yetkili Kişi</label>
                                <input
                                    type="text"
                                    required
                                    value={profile.yetkiliKisi || ''}
                                    onChange={(e) => setProfile({ ...profile, yetkiliKisi: e.target.value })}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:border-teal-500 outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Firma E-Posta</label>
                                <input
                                    type="email"
                                    required
                                    value={profile.email || ''}
                                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:border-teal-500 outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Telefon</label>
                                <input
                                    type="tel"
                                    required
                                    value={profile.telefon || ''}
                                    onChange={(e) => setProfile({ ...profile, telefon: e.target.value })}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:border-teal-500 outline-none transition-all"
                                />
                            </div>
                            <div className="md:col-span-2 space-y-1.5">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Firma Adresi</label>
                                <textarea
                                    rows={3}
                                    value={profile.adres || ''}
                                    onChange={(e) => setProfile({ ...profile, adres: e.target.value })}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:border-teal-500 outline-none transition-all resize-none"
                                    placeholder="Firma açık adresi..."
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end">
                    <button
                        type="submit"
                        disabled={submitting}
                        className="px-12 py-3.5 bg-slate-900 text-white text-[11px] font-black uppercase rounded-xl hover:bg-teal-600 transition-all shadow-xl shadow-slate-200 disabled:opacity-50"
                    >
                        {submitting ? 'Güncelleniyor...' : 'Değişiklikleri Kaydet'}
                    </button>
                </div>
            </form>
        </div>
    )
}
