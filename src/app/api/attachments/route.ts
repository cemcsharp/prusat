import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { unlink } from 'fs/promises'
import { join } from 'path'

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const relatedEntity = searchParams.get('relatedEntity')
    const entityId = searchParams.get('entityId')

    if (!relatedEntity || !entityId) {
        return NextResponse.json({ error: 'Eksik parametreler' }, { status: 400 })
    }

    try {
        const files = await prisma.attachment.findMany({
            where: {
                relatedEntity,
                entityId: parseInt(entityId)
            },
            orderBy: {
                createDate: 'desc'
            }
        })

        return NextResponse.json(files)
    } catch (error) {
        return NextResponse.json({ error: 'Dosyalar yüklenirken hata oluştu' }, { status: 500 })
    }
}

export async function DELETE(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
        return NextResponse.json({ error: 'ID gerekli' }, { status: 400 })
    }

    try {
        const attachment = await prisma.attachment.findUnique({
            where: { id: parseInt(id) }
        })

        if (!attachment) {
            return NextResponse.json({ error: 'Dosya bulunamadı' }, { status: 404 })
        }

        // Dosyayı sistemden sil
        try {
            const filePath = join(process.cwd(), 'public', attachment.filePath)
            await unlink(filePath)
        } catch (err) {
            console.error('Dosya silinirken hata (disk):', err)
            // Diskten silinemese bile veritabanından silelim mi? Evet.
        }

        // Veritabanından sil
        await prisma.attachment.delete({
            where: { id: parseInt(id) }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: 'Dosya silinirken hata oluştu' }, { status: 500 })
    }
}
