import { PrismaClient } from '../src/generated_lib/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const prisma = new PrismaClient();

async function main() {
    const keys = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_SECURE', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM'];

    for (const key of keys) {
        const envValue = process.env[key];
        if (envValue) {
            console.log(`Checking ${key}...`);
            await prisma.systemSetting.upsert({
                where: { key },
                update: {},
                create: {
                    key,
                    value: envValue
                }
            });
        }
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
