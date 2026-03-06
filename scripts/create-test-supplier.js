import { PrismaClient } from '../src/generated_lib/client/index.js'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    const firms = [
        { name: 'Cem A.Ş.', email: 'cem@pru.com' },
        { name: 'Cem Limited Firma', email: 'cem.limited@pru.com' },
        { name: 'Cem TUR Şahıs Firması', email: 'cem.tur@pru.com' }
    ]

    const password = await bcrypt.hash('pru123', 10)

    console.log('\n🚀 Mevcut Tedarikçiler İçin Test Hesapları Oluşturuluyor...\n')

    for (const firm of firms) {
        // 1. Firmayı bul
        const tedarikci = await prisma.tedarikci.findUnique({
            where: { ad: firm.name }
        })

        if (!tedarikci) {
            console.log(`❌ Firma bulunamadı: ${firm.name}`)
            continue
        }

        // 2. Kullanıcı oluştur/güncelle
        const user = await prisma.user.upsert({
            where: { email: firm.email },
            update: {
                role: 'TEDARIKCI',
                tedarikciId: tedarikci.id,
                isTedarikciAdmin: true
            },
            create: {
                email: firm.email,
                name: `${firm.name} Yetkilisi`,
                password: password,
                role: 'TEDARIKCI',
                tedarikciId: tedarikci.id,
                isTedarikciAdmin: true
            }
        })

        console.log(`✅ ${firm.name} için hesap hazır:`)
        console.log(`   E-posta: ${firm.email}`)
        console.log(`   Şifre  : pru123\n`)
    }

    console.log('-----------------------------')
    console.log('Giriş URL: http://localhost:3000/login')
    console.log('-----------------------------\n')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
