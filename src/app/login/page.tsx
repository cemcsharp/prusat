'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const result = await signIn('credentials', {
                email,
                password,
                redirect: false,
            })

            if (result?.error) {
                setError('Giriş başarısız. Bilgilerinizi kontrol ediniz.')
            } else {
                // Session'dan role bilgisini almak için fetch yapalım
                const sessionRes = await fetch('/api/auth/session')
                const session = await sessionRes.json()

                if (session?.user?.role === 'TEDARIKCI') {
                    window.location.href = '/portal/tedarikci'
                } else {
                    window.location.href = '/siparisler'
                }

            }
        } catch (err: any) {
            console.error(err)
            setError('Sistemde bir hata oluştu. Lütfen tekrar deneyiniz.')
        } finally {
            setLoading(false)
        }
    }

    const features = [
        {
            icon: '📋',
            title: 'Talep Yönetimi',
            description: 'Tüm satınalma taleplerini tek noktadan takip edin'
        },
        {
            icon: '📨',
            title: 'RFQ & Teklif Toplama',
            description: 'Tedarikçilere otomatik teklif isteği gönderin'
        },
        {
            icon: '🏢',
            title: 'Tedarikçi Portali',
            description: 'Firma bilgilerini ve performanslarını izleyin'
        },
        {
            icon: '📊',
            title: 'Akıllı Analizler',
            description: 'Gerçek zamanlı raporlar ve KPI takibi'
        },
        {
            icon: '📄',
            title: 'Sözleşme Yönetimi',
            description: 'Tüm sözleşmeleri dijital ortamda saklayın'
        },
        {
            icon: '💰',
            title: 'Finans Takibi',
            description: 'Fatura ve ödeme planlarını yönetin'
        }
    ]

    return (
        <div className="min-h-screen flex">
            {/* Sol Taraf - Özellikler */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 p-12 flex-col justify-between relative overflow-hidden">
                {/* Arka plan deseni */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-20 left-20 w-72 h-72 bg-indigo-500 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500 rounded-full blur-3xl"></div>
                </div>

                <div className="relative z-10">
                    {/* Logo */}
                    <div className="flex items-center gap-4 mb-16">
                        <div className="w-16 h-16 bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                            <span className="text-white font-black text-lg tracking-tight">PRU</span>
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-purple-300 to-indigo-300">PRU</span>
                                <span className="text-white/90"> Satınalma</span>
                            </h1>
                            <p className="text-white/40 text-xs font-medium tracking-wide">Kurumsal Tedarik Yönetim Platformu</p>
                        </div>
                    </div>

                    {/* Başlık */}
                    <div className="mb-12">
                        <h2 className="text-4xl font-black text-white leading-tight mb-4">
                            Satınalma Süreçlerinizi<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Dijitalleştirin</span>
                        </h2>
                        <p className="text-white/60 text-sm leading-relaxed max-w-md">
                            Talepler, teklifler, tedarikçiler ve finansal takip -
                            tüm satınalma operasyonlarınız tek bir platformda.
                        </p>
                    </div>

                    {/* Özellik Listesi */}
                    <div className="grid grid-cols-2 gap-4">
                        {features.map((feature, idx) => (
                            <div
                                key={idx}
                                className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all group"
                            >
                                <div className="text-2xl mb-2">{feature.icon}</div>
                                <h3 className="text-white font-bold text-sm mb-1">{feature.title}</h3>
                                <p className="text-white/40 text-[11px] leading-relaxed">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Alt bilgi */}
                <div className="relative z-10 flex items-center justify-between text-white/30 text-xs">
                    <span>© 2026 PRU - Satınalma Platformu</span>
                    <span>v2.0 Enterprise</span>
                </div>
            </div>

            {/* Sağ Taraf - Giriş Formu */}
            <div className="w-full lg:w-1/2 flex items-center justify-center bg-slate-50 p-8">
                <div className="w-full max-w-md">
                    {/* Mobil Logo */}
                    <div className="lg:hidden text-center mb-8">
                        <div className="w-16 h-16 bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/30">
                            <span className="text-white font-black text-lg">PRU</span>
                        </div>
                        <h1 className="text-xl font-bold">
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600">PRU</span>
                            <span className="text-slate-800"> Satınalma</span>
                        </h1>
                        <p className="text-xs text-slate-400 mt-1">Kurumsal Tedarik Yönetim Platformu</p>
                    </div>

                    {/* Form Kartı */}
                    <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-black">
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600">Hoş Geldiniz</span>
                            </h2>
                            <p className="text-sm text-slate-400 mt-2">Sisteme giriş yapmak için bilgilerinizi girin</p>
                        </div>

                        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                            {error && (
                                <div className="bg-rose-50 text-rose-600 text-[12px] p-4 rounded-xl font-medium border border-rose-100 text-center flex items-center justify-center gap-2">
                                    <span>⚠️</span>
                                    {error}
                                </div>
                            )}

                            <div className="flex flex-col gap-2">
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">
                                    E-Posta Adresi
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">📧</span>
                                    <input
                                        type="email"
                                        required
                                        className="bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 block w-full pl-12 pr-4 py-3.5 outline-none transition-all"
                                        placeholder="mail@sirket.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">
                                    Parola
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔒</span>
                                    <input
                                        type="password"
                                        required
                                        className="bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 block w-full pl-12 pr-4 py-3.5 outline-none transition-all"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between mt-1">
                                <div className="flex items-center gap-2">
                                    <input
                                        id="remember"
                                        type="checkbox"
                                        className="w-4 h-4 border-2 border-slate-300 rounded bg-slate-50 focus:ring-2 focus:ring-purple-500 text-purple-600 cursor-pointer accent-purple-600"
                                    />
                                    <label htmlFor="remember" className="text-xs font-medium text-slate-500 cursor-pointer">
                                        Beni Hatırla
                                    </label>
                                </div>
                                <a href="#" className="text-xs font-semibold text-purple-600 hover:text-purple-700 transition-colors">
                                    Şifremi Unuttum?
                                </a>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full text-white bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-700 hover:via-purple-700 hover:to-indigo-700 focus:ring-4 focus:outline-none focus:ring-purple-300 font-bold rounded-xl text-sm px-5 py-4 text-center mt-2 transition-all shadow-lg shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Giriş Yapılıyor...
                                    </span>
                                ) : (
                                    'GÜVENLİ GİRİŞ'
                                )}
                            </button>
                        </form>


                    </div>

                    {/* Tedarikçi Kayıt Linki */}
                    <div className="mt-6 text-center">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-200"></div>
                            </div>
                            <div className="relative flex justify-center text-xs">
                                <span className="px-4 bg-slate-50 text-slate-400 font-medium">veya</span>
                            </div>
                        </div>
                        <p className="mt-4 text-sm text-slate-600">
                            Tedarikçi misiniz?{' '}
                            <a href="/kayit/tedarikci" className="font-semibold text-teal-600 hover:text-teal-700 transition-colors">
                                Portala Kayıt Olun →
                            </a>
                        </p>
                    </div>


                </div>
            </div>
        </div>
    )
}
