'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function OnayContent() {
    const searchParams = useSearchParams()
    const autoApproved = searchParams.get('auto') === 'true'

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 flex items-center justify-center p-4">
            <div className="w-full max-w-lg">
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-10 text-center">
                    {/* Icon */}
                    <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-full flex items-center justify-center">
                        {autoApproved ? (
                            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        ) : (
                            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        )}
                    </div>

                    {/* Title */}
                    <h1 className="text-2xl font-bold text-white mb-3">
                        {autoApproved ? 'Kaydınız Tamamlandı!' : 'Başvurunuz Alındı!'}
                    </h1>

                    {/* Description */}
                    <p className="text-slate-400 mb-8 leading-relaxed">
                        {autoApproved ? (
                            <>
                                Kaydınız başarıyla tamamlandı. Artık tedarikçi portalına giriş yapabilirsiniz.
                            </>
                        ) : (
                            <>
                                Başvurunuz satınalma ekibimize iletildi. En kısa sürede değerlendirilerek
                                size e-posta ile bilgi verilecektir.
                            </>
                        )}
                    </p>

                    {/* Info Box */}
                    {!autoApproved && (
                        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 mb-8 text-left">
                            <h3 className="text-sm font-bold text-teal-400 mb-2">Sonraki Adımlar</h3>
                            <ul className="text-xs text-slate-400 space-y-1">
                                <li>• Başvurunuz 1-2 iş günü içinde değerlendirilecektir.</li>
                                <li>• Onay sonrası giriş bilgileriniz e-posta ile gönderilecektir.</li>
                                <li>• Sorularınız için satinalma@pru.edu.tr adresine yazabilirsiniz.</li>
                            </ul>
                        </div>
                    )}

                    {/* Button */}
                    <Link
                        href="/login"
                        className="inline-flex items-center justify-center px-8 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-bold rounded-xl hover:from-teal-400 hover:to-emerald-400 transition-all shadow-lg shadow-teal-500/20"
                    >
                        {autoApproved ? 'Giriş Yap' : 'Giriş Sayfasına Dön'}
                    </Link>
                </div>

                {/* Footer */}
                <p className="text-center text-slate-500 text-xs mt-6">
                    PRU Satınalma Platformu - Tedarikçi Portalı
                </p>
            </div>
        </div>
    )
}

export default function TedarikciKayitOnayPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 flex items-center justify-center">
                <div className="text-white">Yükleniyor...</div>
            </div>
        }>
            <OnayContent />
        </Suspense>
    )
}
