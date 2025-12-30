
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
    },
});

export async function sendResetEmail(email: string, token: string) {
    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

    // Fallback: If no email credentials, log to console for dev
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
        console.log('----------------------------------------');
        console.log('📧 [DEV MODE] Email Simulation');
        console.log(`To: ${email}`);
        console.log(`Subject: [Lab Website] Password Reset Request`);
        console.log(`Link: ${resetLink}`);
        console.log('----------------------------------------');
        return;
    }

    try {
        await transporter.sendMail({
            from: process.env.GMAIL_USER,
            to: email,
            subject: '[Lab Website] Password Reset Request',
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>Password Reset Request</h2>
                    <p>You requested a password reset for your Lab Website account.</p>
                    <p>Click the button below to reset your password. This link is valid for 1 hour.</p>
                    <a href="${resetLink}" style="display: inline-block; background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 16px 0;">
                        Reset Password
                    </a>
                    <p style="color: #666; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
                </div>
            `,
        });
        console.log(`📧 Email sent to ${email}`);
    } catch (error) {
        console.error('❌ Failed to send email:', error);
        throw new Error('Failed to send verification email');
    }
}

interface SendEmailParams {
    to: string | string[]
    subject: string
    html: string
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
        console.warn('Gmail credentials not found. Skipping email.')
        console.log('--- Email Content ---')
        console.log('To:', to)
        console.log('Subject:', subject)
        console.log(html)
        return
    }

    try {
        const info = await transporter.sendMail({
            from: `"연구실 알림봇" <${process.env.GMAIL_USER}>`,
            to: Array.isArray(to) ? to.join(', ') : to,
            subject,
            html,
        })
        console.log('Message sent: %s', info.messageId)
        return info
    } catch (error) {
        console.error('Error sending email:', error)
        // Don't throw to prevent blocking the main action
        return { error }
    }
}
