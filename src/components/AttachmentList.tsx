'use client'

import { useState, useEffect, useCallback } from 'react'
import { getAttachments, deleteAttachment } from '@/lib/actions'
import { useNotification } from '@/context/NotificationContext'

interface AttachmentListProps {
    relatedEntity: string
    entityId: number
    refreshTrigger?: number
}

export default function AttachmentList({ relatedEntity, entityId, refreshTrigger = 0 }: AttachmentListProps) {
    const [attachments, setAttachments] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const { showAlert, showConfirm } = useNotification()

    const fetchAttachments = useCallback(async () => {
        setLoading(true)
        const data = await getAttachments(relatedEntity, entityId)
        setAttachments(data)
        setLoading(false)
    }, [relatedEntity, entityId])

    useEffect(() => {
        fetchAttachments()
    }, [fetchAttachments, refreshTrigger])

    const handleDelete = async (id: number) => {
        const confirmed = await showConfirm('Bu dosyayı silmek istediğinize emin misiniz?')
        if (!confirmed) return

        const res = await deleteAttachment(id)
        if (res.success) {
            showAlert('Dosya başarıyla silindi', 'success')
            fetchAttachments()
        } else {
            showAlert('Hata: ' + res.error, 'error')
        }
    }

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B'
        const k = 1024
        const sizes = ['B', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    if (loading) return <div className="text-[10px] uppercase tracking-widest text-slate-400 p-4">Dosyalar yükleniyor...</div>

    if (attachments.length === 0) return null

    return (
        <div className="flex flex-col gap-2">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Ek Dosyalar ({attachments.length})</h4>
            <div className="grid grid-cols-1 gap-2">
                {attachments.map((file) => (
                    <div key={file.id} className="flex items-center justify-between bg-white border border-slate-100 rounded-lg p-3 hover:shadow-md transition-all group">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-8 h-8 rounded bg-slate-50 flex items-center justify-center shrink-0">
                                {file.fileType.includes('image') ? '🖼️' : '📄'}
                            </div>
                            <div className="flex flex-col overflow-hidden">
                                <span className="text-xs font-bold text-slate-700 truncate uppercase tracking-tighter" title={file.fileName}>{file.fileName}</span>
                                <span className="text-[9px] text-slate-400 uppercase">{formatSize(file.fileSize)}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <a
                                href={`/api/attachments/${file.id}`}
                                download
                                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 uppercase p-1"
                                title="İndir"
                            >
                                ⬇️
                            </a>
                            <button
                                onClick={() => handleDelete(file.id)}
                                className="text-[10px] font-bold text-rose-600 hover:text-rose-700 uppercase p-1"
                                title="Sil"
                            >
                                🗑️
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
