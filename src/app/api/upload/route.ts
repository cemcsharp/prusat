import { NextRequest, NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData()
        const file = formData.get('file') as File
        const relatedEntity = formData.get('relatedEntity') as string
        const entityIdStr = formData.get('entityId') as string
        const entityId = parseInt(entityIdStr)

        if (!file || !relatedEntity || isNaN(entityId)) {
            return NextResponse.json({ error: 'Eksik bilgi' }, { status: 400 })
        }

        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        // Benzersiz dosya adı oluştur
        const uniqueFileName = `${Date.now()}-${file.name.replace(/\s/g, '_')}`
        const uploadDir = join(process.cwd(), 'public', 'uploads')
        const path = join(uploadDir, uniqueFileName)

        // Dosyayı kaydet
        await writeFile(path, buffer)

        // Veritabanına kaydet
        const attachment = await prisma.attachment.create({
            data: {
                fileName: file.name,
                filePath: `/uploads/${uniqueFileName}`,
                fileType: file.type,
                fileSize: file.size,
                relatedEntity,
                entityId
            }
        })

        return NextResponse.json({ success: true, attachment })
    } catch (err) {
        console.error('Upload Error:', err)
        return NextResponse.json({ error: (err as Error).message }, { status: 500 })
    }
}
