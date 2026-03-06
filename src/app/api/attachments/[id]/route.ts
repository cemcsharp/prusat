import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'
import prisma from '@/lib/prisma'

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const attachment = await prisma.attachment.findUnique({
            where: { id: parseInt(id) }
        })

        if (!attachment) {
            return NextResponse.json({ error: 'Dosya bulunamadı' }, { status: 404 })
        }

        const path = join(process.cwd(), 'public', attachment.filePath)
        const fileBuffer = await readFile(path)

        return new NextResponse(fileBuffer, {
            headers: {
                'Content-Type': attachment.fileType,
                'Content-Disposition': `attachment; filename="${encodeURIComponent(attachment.fileName)}"`
            }
        })
    } catch (err) {
        return NextResponse.json({ error: (err as Error).message }, { status: 500 })
    }
}
