'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { updatePersonalProfile } from '@/lib/actions'
import { useNotification } from '@/context/NotificationContext'

export default function ProfilPage() {
    const { data: session, update: updateSession } = useSession()
    const { showAlert } = useNotification()
    const [submitting, setSubmitting] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        image: '',
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    })

    useEffect(() => {
        if (session?.user) {
            setFormData(prev => ({
                ...prev,
                name: session.user?.name || '',
                email: session.user?.email || '',
                image: session.user?.image || ''
            }))
        }
    }, [session])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
            showAlert('Yeni şifreler eşleşmiyor', 'error')
            return
        }

        setSubmitting(true)
        try {
            await updatePersonalProfile({
                name: formData.name,
                email: formData.email,
                image: formData.image || undefined,
                password: formData.newPassword || undefined
            })

            await updateSession({
                name: formData.name,
                email: formData.email,
                image: formData.image
            })

            showAlert('Profiliniz başarıyla güncellendi', 'success')
            setFormData(prev => ({ ...prev, oldPassword: '', newPassword: '', confirmPassword: '' }))
        } catch (err) {
            showAlert('Hata: ' + (err as Error).message, 'error')
        } finally {
            setSubmitting(false)
        }
    }

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const fd = new FormData()
        fd.append('file', file)
        fd.append('relatedEntity', 'USER_AVATAR')
        fd.append('entityId', session?.user?.id || '0')

        try {
            const res = await fetch('/api/upload', { method: 'POST', body: fd })
            const data = await res.json()
            if (data.success) {
                setFormData(prev => ({ ...prev, image: data.attachment.filePath }))
                showAlert('Profil fotoğrafı yüklendi, kaydetmeyi unutmayın', 'info')
            } else {
                throw new Error(data.error || 'Yükleme başarısız')
            }
        } catch (err) {
            showAlert('Hata: ' + (err as Error).message, 'error')
        }
    }

    if (!session) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-pulse text-slate-400 uppercase tracking-widest text-[11px] font-bold">Oturum Doğrulanıyor...</div>
            </div>
        )
    }

    const initials = formData.name
        ? formData.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
        : '??'

    return (
        <div className="max-w-4xl mx-auto animate-in">
            {/* Page Header */}
            <div className="flex justify-between items-end border-b border-slate-200 pb-5 mb-8">
                <div>
                    <h2 className="text-[15px] font-medium text-slate-800 uppercase tracking-widest">Profil Ayarları</h2>
                    <p className="text-[9px] text-slate-500 font-medium mt-0.5 uppercase tracking-tighter">Kişisel Bilgi ve Güvenlik Yönetimi</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left: Avatar & Info Summary */}
                <div className="flex flex-col gap-6">
                    <div className="premium-card p-8 flex flex-col items-center text-center">
                        <div className="relative group cursor-pointer" onClick={() => document.getElementById('avatar-input')?.click()}>
                            {formData.image ? (
                                <img
                                    src={formData.image}
                                    alt="Avatar"
                                    className="w-24 h-24 rounded-2xl object-cover shadow-xl border-4 border-white transition-all group-hover:brightness-75"
                                />
                            ) : (
                                <div className="w-24 h-24 bg-slate-900 text-white rounded-2xl flex items-center justify-center text-3xl font-bold mb-4 shadow-xl shadow-slate-200 border-4 border-white group-hover:bg-slate-800 transition-all">
                                    {initials}
                                </div>
                            )}
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-[10px] text-white font-bold uppercase tracking-widest bg-black/40 px-2 py-1 rounded">Değiştir</span>
                            </div>
                            <input
                                id="avatar-input"
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={handleAvatarUpload}
                            />
                        </div>
                        <h3 className="text-slate-800 font-bold text-[14px] uppercase tracking-wider mt-4">{formData.name}</h3>
                        <p className="text-slate-400 text-[10px] font-medium uppercase tracking-widest mt-1">{session.user?.role || 'Kullanıcı'}</p>

                        <div className="w-full h-px bg-slate-100 my-6"></div>

                        <div className="w-full flex flex-col gap-3">
                            <div className="flex justify-between text-[10px] font-medium px-2">
                                <span className="text-slate-400 uppercase tracking-tighter">E-posta</span>
                                <span className="text-slate-700 truncate ml-2 font-bold">{formData.email}</span>
                            </div>
                            <div className="flex justify-between text-[10px] font-medium px-2">
                                <span className="text-slate-400 uppercase tracking-tighter">Durum</span>
                                <span className="text-emerald-600 font-bold uppercase tracking-widest">Aktif</span>
                            </div>
                        </div>
                    </div>

                    <div className="premium-card p-6 bg-slate-50/50 border-slate-200">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Güvenlik Notu</h4>
                        <p className="text-[9px] text-slate-500 leading-relaxed font-medium">
                            Şifreniz en az 6 karakterden oluşmalı ve düzenli aralıklarla güncellenmelidir. Hesabınızın güvenliği için güçlü şifre kombinasyonları kullanınız.
                        </p>
                    </div>
                </div>

                {/* Right: Forms */}
                <div className="md:col-span-2 flex flex-col gap-6">
                    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                        {/* Basic Info القسم */}
                        <div className="premium-card p-0 overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/30">
                                <h3 className="text-[11px] font-bold text-slate-700 uppercase tracking-widest">Temel Bilgiler</h3>
                            </div>
                            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] font-medium text-slate-400 uppercase tracking-widest ml-1">Tam İsim</label>
                                    <input
                                        type="text"
                                        required
                                        className="bg-white border border-slate-200 px-3 py-2 rounded text-[12px] font-medium text-slate-800 outline-none focus:border-slate-400 transition-all shadow-sm"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] font-medium text-slate-400 uppercase tracking-widest ml-1">E-posta Adresi</label>
                                    <input
                                        type="email"
                                        required
                                        className="bg-white border border-slate-200 px-3 py-2 rounded text-[12px] font-medium text-slate-800 outline-none focus:border-slate-400 transition-all shadow-sm"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Password القسم */}
                        <div className="premium-card p-0 overflow-hidden border-t-2 border-t-rose-500/10">
                            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/30">
                                <h3 className="text-[11px] font-bold text-slate-700 uppercase tracking-widest">Erişim & Güvenlik</h3>
                            </div>
                            <div className="p-6 flex flex-col gap-5">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-medium text-slate-400 uppercase tracking-widest ml-1">Yeni Şifre</label>
                                        <input
                                            type="password"
                                            placeholder="••••••••"
                                            className="bg-white border border-slate-200 px-3 py-2 rounded text-[12px] font-medium text-slate-800 outline-none focus:border-slate-400 transition-all shadow-sm"
                                            value={formData.newPassword}
                                            onChange={e => setFormData({ ...formData, newPassword: e.target.value })}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-medium text-slate-400 uppercase tracking-widest ml-1">Yeni Şifre (Tekrar)</label>
                                        <input
                                            type="password"
                                            placeholder="••••••••"
                                            className="bg-white border border-slate-200 px-3 py-2 rounded text-[12px] font-medium text-slate-800 outline-none focus:border-slate-400 transition-all shadow-sm"
                                            value={formData.confirmPassword}
                                            onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <p className="text-[9px] text-slate-400 font-medium italic">
                                    * Şifrenizi değiştirmek istemiyorsanız bu alanları boş bırakınız.
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end pt-2">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="bg-slate-800 text-white px-8 py-2.5 rounded text-[11px] font-bold hover:bg-slate-950 transition-all shadow-lg shadow-slate-200 uppercase tracking-widest disabled:opacity-50"
                            >
                                {submitting ? 'Güncelleniyor...' : 'Profil Bilgilerini Kaydet'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
