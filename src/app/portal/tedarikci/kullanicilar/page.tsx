'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { getSupplierUsers, createSupplierUser } from '@/lib/portalActions'
import { useNotification } from '@/context/NotificationContext'

export default function SupplierUsersPage() {
    const { data: session } = useSession()
    const { showAlert } = useNotification()
    const [users, setUsers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    // New User Form State
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        isAdmin: false
    })

    useEffect(() => {
        async function fetchData() {
            // @ts-ignore
            if (session?.user?.tedarikciId) {
                // @ts-ignore
                const data = await getSupplierUsers(session.user.tedarikciId)
                setUsers(data)
            }
            setLoading(false)
        }
        fetchData()
    }, [session])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        // @ts-ignore
        if (!session?.user?.tedarikciId) return

        setSubmitting(true)
        // @ts-ignore
        const result = await createSupplierUser(session.user.tedarikciId, formData)
        setSubmitting(false)

        if (result.success) {
            showAlert('Kullanıcı başarıyla oluşturuldu.', 'success')
            setShowModal(false)
            setFormData({ name: '', email: '', password: '', isAdmin: false })
            // Listeyi yenile
            // @ts-ignore
            const updatedUsers = await getSupplierUsers(session.user.tedarikciId)
            setUsers(updatedUsers)
        } else {
            showAlert(result.error || 'Hata oluştu', 'error')
        }
    }

    // @ts-ignore
    const isCurrentUserAdmin = session?.user?.isTedarikciAdmin

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                    <h1 className="text-xl font-bold text-slate-800 tracking-tight">Ekip Yönetimi</h1>
                    <p className="text-sm text-slate-500">Portal üzerinden firmanız adına işlem yapacak kullanıcılar</p>
                </div>
                {isCurrentUserAdmin && (
                    <button
                        onClick={() => setShowModal(true)}
                        className="px-6 py-2.5 bg-slate-900 text-white text-xs font-bold uppercase rounded-xl hover:bg-teal-600 transition-all shadow-lg shadow-slate-200 flex items-center gap-2"
                    >
                        <span>➕</span>
                        Yeni Kullanıcı
                    </button>
                )}
            </div>

            {loading ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
                    <div className="animate-spin text-3xl mb-4 text-teal-600">⌛</div>
                    <p className="text-slate-500 font-medium">Kullanıcılar yükleniyor...</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <table className="w-full text-left font-inter">
                        <thead className="bg-slate-50/80 text-[10px] uppercase font-bold text-slate-400 tracking-widest border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4">Kullanıcı Adı</th>
                                <th className="px-6 py-4">E-Posta</th>
                                <th className="px-6 py-4">Yetki</th>
                                <th className="px-6 py-4">Kayıt Tarihi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {users.map(user => (
                                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 border border-slate-200">
                                                {user.name?.charAt(0).toUpperCase() || 'U'}
                                            </div>
                                            <p className="text-xs font-bold text-slate-800">{user.name}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-xs text-slate-500 font-medium">
                                        {user.email}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${user.isTedarikciAdmin
                                                ? 'bg-purple-50 text-purple-600 border-purple-100'
                                                : 'bg-slate-50 text-slate-500 border-slate-200'
                                            }`}>
                                            {user.isTedarikciAdmin ? 'Yönetici' : 'Standart'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-[10px] text-slate-400 font-bold">
                                        {new Date(user.createDate).toLocaleDateString('tr-TR')}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Yeni Kullanıcı Modalı */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight italic">Yeni Ekip Arkadaşı</h2>
                            <p className="text-xs text-slate-400 mt-1 font-medium">Firma adına işlem yapacak kullanıcıyı tanımlayın</p>
                        </div>
                        <form onSubmit={handleSubmit} className="p-8 space-y-5">
                            <div className="space-y-1.5">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Ad Soyad</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:bg-white focus:border-teal-500 outline-none transition-all"
                                    placeholder="Örn: Ahmet Yılmaz"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">E-Posta Adresi</label>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:bg-white focus:border-teal-500 outline-none transition-all"
                                    placeholder="ahmet@firma.com"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Geçici Şifre</label>
                                <input
                                    type="password"
                                    required
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:bg-white focus:border-teal-500 outline-none transition-all"
                                    placeholder="Min. 8 karakter"
                                />
                            </div>

                            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                                <input
                                    type="checkbox"
                                    id="isAdmin"
                                    checked={formData.isAdmin}
                                    onChange={(e) => setFormData({ ...formData, isAdmin: e.target.checked })}
                                    className="w-4 h-4 text-teal-600 bg-white border-slate-300 rounded focus:ring-teal-500"
                                />
                                <label htmlFor="isAdmin" className="text-xs font-bold text-slate-600 cursor-pointer">
                                    Firma Yöneticisi Yetkisi Ver
                                    <span className="block text-[9px] text-slate-400 font-medium normal-case mt-0.5">Admin kullanıcılar ekip yönetebilir ve firma bilgilerini güncelleyebilir.</span>
                                </label>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-3.5 bg-slate-100 text-slate-500 text-[11px] font-black uppercase rounded-xl hover:bg-slate-200 transition-all border border-slate-200"
                                >
                                    Vazgeç
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 py-3.5 bg-slate-900 text-white text-[11px] font-black uppercase rounded-xl hover:bg-teal-600 transition-all shadow-xl shadow-slate-200 disabled:opacity-50"
                                >
                                    {submitting ? 'Oluşturuluyor...' : 'Kullanıcıyı Kaydet'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
