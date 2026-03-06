'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'

type NotificationType = 'success' | 'error' | 'info' | 'warning'

interface Alert {
    id: string
    message: string
    type: NotificationType
}

interface ConfirmOptions {
    message: string
    title?: string
    confirmText?: string
    cancelText?: string
}

interface NotificationContextType {
    showAlert: (message: string, type?: NotificationType) => void
    showConfirm: (options: ConfirmOptions | string) => Promise<boolean>
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
    const [alerts, setAlerts] = useState<Alert[]>([])
    const [confirmState, setConfirmState] = useState<{
        isOpen: boolean
        options: ConfirmOptions
        resolve: (value: boolean) => void
    } | null>(null)

    const showAlert = useCallback((message: string, type: NotificationType = 'info') => {
        const id = Math.random().toString(36).substring(2, 9)
        setAlerts((prev) => [...prev, { id, message, type }])

        // Auto-remove alert after 5 seconds
        setTimeout(() => {
            setAlerts((prev) => prev.filter((a) => a.id !== id))
        }, 5000)
    }, [])

    const showConfirm = useCallback((options: ConfirmOptions | string) => {
        return new Promise<boolean>((resolve) => {
            const standardizedOptions: ConfirmOptions =
                typeof options === 'string' ? { message: options } : options

            setConfirmState({
                isOpen: true,
                options: standardizedOptions,
                resolve
            })
        })
    }, [])

    const handleConfirmResponse = (value: boolean) => {
        if (confirmState) {
            confirmState.resolve(value)
            setConfirmState(null)
        }
    }

    return (
        <NotificationContext.Provider value={{ showAlert, showConfirm }}>
            {children}

            {/* Toast Alerts Container */}
            <div className="fixed top-8 right-8 z-[9999] flex flex-col gap-3 pointer-events-none">
                {alerts.map((alert) => (
                    <div
                        key={alert.id}
                        className={`
              pointer-events-auto px-6 py-4 rounded-2xl shadow-2xl border backdrop-blur-md flex items-center justify-between gap-4 animate-in slide-in-from-right-full duration-300 min-w-[300px]
              ${alert.type === 'success' ? 'bg-emerald-600 border-emerald-500/50 text-white shadow-emerald-500/20' : ''}
              ${alert.type === 'error' ? 'bg-rose-600 border-rose-500/50 text-white shadow-rose-500/20' : ''}
              ${alert.type === 'warning' ? 'bg-amber-500 border-amber-400/50 text-white shadow-amber-500/20' : ''}
              ${alert.type === 'info' ? 'bg-blue-600 border-blue-500/50 text-white shadow-blue-500/20' : ''}
            `}
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-xl">
                                {alert.type === 'success' ? '✅' : alert.type === 'error' ? '❌' : alert.type === 'warning' ? '⚠️' : 'ℹ️'}
                            </span>
                            <span className="text-[13px] font-bold tracking-wide">
                                {alert.message}
                            </span>
                        </div>
                        <button
                            onClick={() => setAlerts((prev) => prev.filter((a) => a.id !== alert.id))}
                            className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/20 transition-all text-white/80"
                        >
                            ×
                        </button>
                    </div>
                ))}
            </div>

            {/* Confirmation Modal Overlay */}
            {confirmState && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => handleConfirmResponse(false)} />
                    <div className="relative bg-white w-full max-w-[440px] rounded-[28px] shadow-2xl border border-white/20 overflow-hidden transform animate-in zoom-in-95 duration-200">
                        <div className="p-8">
                            <div className="flex flex-col items-center text-center">
                                <div className="w-20 h-20 rounded-3xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-6 shadow-inner">
                                    <span className="text-3xl">❓</span>
                                </div>
                                <h3 className="text-slate-900 text-xl font-black tracking-tight uppercase mb-3">
                                    {confirmState.options.title || 'Onay Gerekli'}
                                </h3>
                                <p className="text-slate-500 text-[14px] font-medium leading-relaxed">
                                    {confirmState.options.message}
                                </p>
                            </div>

                            <div className="mt-10 flex flex-col sm:flex-row gap-3">
                                <button
                                    onClick={() => handleConfirmResponse(false)}
                                    className="flex-1 px-6 py-4 rounded-2xl text-[12px] font-black text-slate-500 hover:text-blue-600 hover:bg-blue-50 border border-slate-100 transition-all uppercase tracking-widest"
                                >
                                    {confirmState.options.cancelText || 'İptal Et'}
                                </button>
                                <button
                                    onClick={() => handleConfirmResponse(true)}
                                    className="flex-[1.5] px-6 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-[12px] font-black shadow-xl shadow-blue-500/20 transition-all uppercase tracking-widest active:scale-95"
                                >
                                    {confirmState.options.confirmText || 'Evet, Onayla'}
                                </button>
                            </div>
                        </div>

                        {/* Design Detail */}
                        <div className="h-1.5 w-full bg-gradient-to-r from-blue-400 via-sky-400 to-indigo-500 shadow-sm" />
                    </div>
                </div>
            )}
        </NotificationContext.Provider>
    )
}

export const useNotification = () => {
    const context = useContext(NotificationContext)
    if (context === undefined) {
        throw new Error('useNotification must be used within a NotificationProvider')
    }
    return context
}
