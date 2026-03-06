import { PrismaClient } from '../src/generated_lib/client'
import bcrypt from 'bcryptjs'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

async function main() {
    // Birimler
    const birimler = ['Bilgi İşlem', 'İdari İşler', 'Finans', 'Lojistik', 'Üretim']
    for (const ad of birimler) {
        await prisma.birim.upsert({
            where: { ad },
            update: {},
            create: { ad },
        })
    }

    // Yönetmelik Maddeleri
    const maddeler = [
        { madde: 'Madde 1', aciklama: 'Doğrudan Temin Sınırı' },
        { madde: 'Madde 2', aciklama: 'Pazarlık Usulü' },
        { madde: 'Madde 3', aciklama: 'İhale Usulü' },
    ]
    for (const m of maddeler) {
        await prisma.yonetmelik.upsert({
            where: { madde: m.madde },
            update: {},
            create: m,
        })
    }

    // Alım Yöntemleri
    const yontemler = ['Doğrudan Temin', 'İhale', 'Pazarlık', 'Çerçeve Anlaşma']
    for (const ad of yontemler) {
        await prisma.alimYontemi.upsert({
            where: { ad },
            update: {},
            create: { ad },
        })
    }

    // Personel
    const personeller = [
        { adSoyad: 'Ali Veli', unvan: 'Satınalma Müdürü' },
        { adSoyad: 'Ayşe Yılmaz', unvan: 'Satınalma Uzmanı' },
        { adSoyad: 'Mehmet Demir', unvan: 'Satınalma Personeli' },
    ]
    for (const p of personeller) {
        await prisma.personel.create({
            data: p,
        })
    }

    // Tedarikçiler
    const tedarikciler = [
        { ad: 'ABC Teknoloji A.Ş.', yetkiliKisi: 'Ahmet Yılmaz', telefon: '0212 555 1234', email: 'info@abctech.com', vergiNo: '1234567890' },
        { ad: 'XYZ Yazılım Ltd.', yetkiliKisi: 'Fatma Kaya', telefon: '0216 444 5678', email: 'satis@xyz.com.tr', vergiNo: '0987654321' },
        { ad: 'Mega Bilişim', yetkiliKisi: 'Mehmet Can', telefon: '0312 333 9876', email: 'mehmet@mega.com', vergiNo: '5555555555' },
    ]
    for (const t of tedarikciler) {
        await prisma.tedarikci.upsert({
            where: { ad: t.ad },
            update: {},
            create: t,
        })
    }

    // --- ADMIN USER & PERSONEL OLUŞTURMA ---
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@talep.com'
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'
    const adminName = 'Sistem Yöneticisi'

    // 1. Admin Personel Kaydı
    const adminPersonel = await prisma.personel.create({
        data: {
            adSoyad: adminName,
            unvan: 'Yönetici',
            email: adminEmail,
            isBirimYoneticisi: true,
        }
    })

    // 2. Admin User Kaydı (Şifre Hashleme)
    // removed local import
    const hashedPassword = await bcrypt.hash(adminPassword, 10)

    await prisma.user.upsert({
        where: { email: adminEmail },
        update: {},
        create: {
            name: adminName,
            email: adminEmail,
            password: hashedPassword,
            role: 'ADMIN',
            personelId: adminPersonel.id
        }
    })

    console.log(`Admin kullanıcı oluşturuldu: ${adminEmail}`)
    console.log('Seed verileri başarıyla yüklendi.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
