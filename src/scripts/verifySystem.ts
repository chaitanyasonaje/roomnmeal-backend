import dotenv from 'dotenv';
import path from 'path';
// Load env before anything else
dotenv.config({ path: path.join(__dirname, '../../.env') });

import Razorpay from 'razorpay';
import nodemailer from 'nodemailer';

async function verify() {
    console.log('Starting System Verification...\n');

    // 1. Env Validation
    const requiredVars = [
        'RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET', 'RAZORPAY_WEBHOOK_SECRET',
        'SMTP_HOST', 'SMTP_PORT', 'SMTP_EMAIL', 'SMTP_PASSWORD'
    ];
    const missing = requiredVars.filter(p => !process.env[p]);
    if (missing.length > 0) {
        console.error('❌ Missing Environment Variables:', missing.join(', '));
    } else {
        console.log('✅ Critical Environment Variables Present');
    }

    // 2. Razorpay
    console.log('\n--- 1. Razorpay Verification ---');
    try {
        if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
            throw new Error("Razorpay Credentials Missing");
        }

        const rzp = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });

        console.log(`ℹ️  Key ID Loaded: ${process.env.RAZORPAY_KEY_ID.substring(0, 8)}...`);

        // Test Auth by creating a small order
        const order = await rzp.orders.create({
            amount: 100, // 1 INR in paise
            currency: 'INR',
            receipt: 'verify_' + Date.now(),
        });
        console.log('✅ Razorpay Connection: Success');
        console.log('✅ Order Creation: Success');
        console.log(`   Order ID: ${order.id}`);

        // Verify we can fetch it back
        const fetchedOrder = await rzp.orders.fetch(order.id as string);
        if (fetchedOrder.id === order.id) {
            console.log('✅ Order Fetch: Success');
        }

    } catch (e: any) {
        console.error('❌ Razorpay Verification Failed:', e.error ? e.error.description : e.message);
    }

    // 3. SMTP
    console.log('\n--- 2. SMTP Verification ---');
    try {
        if (!process.env.SMTP_PASSWORD || process.env.SMTP_PASSWORD.includes('your_16_character')) {
            console.warn('⚠️  SMTP_PASSWORD appears to be a placeholder. Email test will likely fail.');
        }

        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT),
            secure: false, // usually false for 587
            auth: {
                user: process.env.SMTP_EMAIL,
                pass: process.env.SMTP_PASSWORD,
            },
        });

        // Verify connection config
        console.log(`ℹ️  Connecting to SMTP: ${process.env.SMTP_HOST}:${process.env.SMTP_PORT}`);
        await transporter.verify();
        console.log('✅ SMTP Connection: Success (Login Successful)');

        // Send test email
        console.log(`ℹ️  Sending test email to: ${process.env.SMTP_EMAIL}`);
        const info = await transporter.sendMail({
            from: process.env.FROM_EMAIL || process.env.SMTP_EMAIL,
            to: process.env.SMTP_EMAIL, // Send to self
            subject: 'RoomNMeal System Verification',
            text: 'This is a test email to verify the SMTP configuration. If you received this, your email system is working!',
        });
        console.log('✅ Test Email Sent: Success');
        console.log(`   Message ID: ${info.messageId}`);

    } catch (e: any) {
        console.error('❌ SMTP Verification Failed:', e.message);
        if (e.code === 'EAUTH') console.error('   Hint: Check your Email and App Password.');
    }

    // 4. Webhook Config Check
    console.log('\n--- 3. Webhook Configuration Check ---');
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (secret && secret !== 'replace_this_with_strong_random_secret_string') {
        console.log('✅ Webhook Secret Configured (non-default)');
    } else {
        console.warn('⚠️  Webhook Secret is missing or default placeholder. Signature verification will fail.');
    }

    console.log('\nVerification Complete.');
}

verify();
