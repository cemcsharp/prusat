import { PrismaClient } from '../src/generated_lib/client/index.js'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    const hashedPassword = await bcrypt.hash('password123', 10)

    // Get a personel ID to link
    const personel = await prisma.personel.findFirst()

    const user = await prisma.user.upsert({
        where: { email: 'admin@taleptakip.com' },
        update: {
            password: hashedPassword,
            role: 'ADMIN'
        },
        create: {
            email: 'admin@taleptakip.com',
            name: 'System Admin',
            password: hashedPassword,
            role: 'ADMIN',
            personelId: personel?.id
        }
    })

    console.log('Admin user created:', user.email)
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect())
