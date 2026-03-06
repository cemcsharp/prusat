import { PrismaClient } from '../generated_lib/client'

const prismaClientSingleton = () => {
    if (typeof window !== 'undefined') return undefined;
    return new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    })
}

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClientSingleton | undefined
}

const prisma = globalForPrisma.prisma ?? prismaClientSingleton()

export default prisma as PrismaClient

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
