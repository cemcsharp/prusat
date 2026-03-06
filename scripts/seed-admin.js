const { PrismaClient } = require('../src/generated_lib/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('Admin hesabı oluşturuluyor/güncelleniyor...');

    const email = 'cemtur@gmail.com';
    const password = '123456';

    // 1. Birim Oluştur (Eğer yoksa)
    const birim = await prisma.birim.upsert({
        where: { ad: 'Bilgi İşlem Daire Bşk.' },
        update: {},
        create: {
            ad: 'Bilgi İşlem Daire Bşk.',
            email: email
        }
    });

    // 2. Personel Oluştur (Admin)
    let personel = await prisma.personel.findFirst({
        where: { email: email }
    });

    if (!personel) {
        personel = await prisma.personel.create({
            data: {
                adSoyad: 'Cem TUR',
                email: email,
                unvan: 'IT Müdürü',
                aktif: true
            }
        });
    }

    // 3. User Oluştur/Güncelle
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.upsert({
        where: { email: email },
        update: {
            password: hashedPassword,
            role: 'ADMIN',
            name: 'Cem TUR'
        },
        create: {
            name: 'Cem TUR',
            email: email,
            password: hashedPassword,
            role: 'ADMIN',
            personelId: personel.id
        }
    });

    console.log(`BİLGİ: Admin hesabı başarıyla güncellendi.`);
    console.log(`E-Posta: ${email}`);
    console.log(`Şifre: ${password}`);
}

main()
    .catch((e) => {
        console.error('HATA:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
