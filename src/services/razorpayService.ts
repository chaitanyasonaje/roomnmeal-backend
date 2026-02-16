import Razorpay from 'razorpay';
import crypto from 'crypto';

let razorpay: Razorpay | null = null;

try {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (keyId && keySecret) {
        razorpay = new Razorpay({
            key_id: keyId,
            key_secret: keySecret,
        });
        console.log('✓ Razorpay initialized');
    } else {
        console.warn('⚠ Razorpay credentials missing in .env - payment features will fail');
        console.warn('  Required: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET');
    }
} catch (error) {
    console.error('⚠ Razorpay initialization failed:', error);
}

export interface CreateOrderOptions {
    amount: number;
    currency?: string;
    receipt?: string;
}

export const createOrder = async (
    options: CreateOrderOptions
): Promise<any> => {
    if (!razorpay) {
        throw new Error('Razorpay not configured. Please add valid credentials to .env file.');
    }

    try {
        const order = await razorpay.orders.create({
            amount: options.amount * 100, // Razorpay expects amount in paise
            currency: options.currency || 'INR',
            receipt: options.receipt || `receipt_${Date.now()}`,
        });

        return order;
    } catch (error) {
        throw new Error('Failed to create Razorpay order');
    }
};

export const verifyPaymentSignature = (
    orderId: string,
    paymentId: string,
    signature: string
): boolean => {
    try {
        const text = orderId + '|' + paymentId;
        if (!process.env.RAZORPAY_KEY_SECRET) {
            throw new Error('RAZORPAY_KEY_SECRET is not defined');
        }
        const generatedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(text)
            .digest('hex');

        // SECURITY FIX: Timing-safe comparison
        return crypto.timingSafeEqual(
            Buffer.from(generatedSignature),
            Buffer.from(signature)
        );
    } catch (error) {
        return false;
    }
};

export const refundPayment = async (paymentId: string, amount?: number) => {
    if (!razorpay) {
        throw new Error('Razorpay not initialized');
    }
    try {
        const options: any = {
            payment_id: paymentId,
        };
        if (amount) {
            options.amount = amount * 100; // Convert to paise
        }
        return await razorpay.payments.refund(paymentId, options);
    } catch (error) {
        throw error;
    }
};

export default razorpay;
