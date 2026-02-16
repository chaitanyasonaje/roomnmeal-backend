import nodemailer from 'nodemailer';
import logger from '../config/logger';

// Create reusable transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
    },
});

export const sendEmail = async (options: { email: string; subject: string; message: string; html?: string }) => {
    try {
        const message = {
            from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
            to: options.email,
            subject: options.subject,
            text: options.message,
            html: options.html,
        };

        const info = await transporter.sendMail(message);

        // logger.info(`Email sent: ${info.messageId}`);
        return info;
    } catch (error) {
        logger.error('Error sending email', error);
        throw new Error('Email could not be sent');
    }
};
