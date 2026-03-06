
import nodemailer from 'nodemailer'
import dotenv from 'dotenv'
import path from 'path'

// Load .env from root
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

async function main() {
    console.log('Testing SMTP Configuration...')

    const config = {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    }

    console.log('Config:', { ...config, auth: { ...config.auth, pass: '***' } })

    const transporter = nodemailer.createTransport(config)

    try {
        await transporter.verify()
        console.log('Verifying connection... OK')

        // Try sending
        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM,
            to: process.env.SMTP_USER, // Send to self
            subject: 'Test Email from CLI',
            text: 'If you see this, SMTP is working.'
        })
        console.log('Message sent: %s', info.messageId)
    } catch (err) {
        console.error('Error:', err)
    }
}

main()
