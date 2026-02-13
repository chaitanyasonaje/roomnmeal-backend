import { Response, Request } from 'express';
import Payment from '../models/Payment';
import crypto from 'crypto';
import Booking from '../models/Booking';
import { AuthRequest } from '../middleware/auth';
import { createOrder, verifyPaymentSignature } from '../services/razorpayService';

export const createPaymentOrder = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { bookingId } = req.body;

        // Find the booking
        const booking = await Booking.findById(bookingId);

        if (!booking) {
            res.status(404).json({
                success: false,
                message: 'Booking not found',
            });
            return;
        }

        // Check if user owns this booking
        if (booking.userId.toString() !== req.user?._id.toString()) {
            res.status(403).json({
                success: false,
                message: 'Not authorized',
            });
            return;
        }

        // Create Razorpay order
        const order = await createOrder({
            amount: booking.totalAmount,
            receipt: `booking_${bookingId}`,
        });

        // Save payment record
        const payment = await Payment.create({
            userId: req.user?._id,
            bookingId,
            razorpayOrderId: order.id,
            amount: booking.totalAmount,
            currency: 'INR',
            status: 'created',
        });

        res.status(201).json({
            success: true,
            message: 'Payment order created successfully',
            data: {
                orderId: order.id,
                amount: order.amount,
                currency: order.currency,
                paymentId: payment._id,
            },
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create payment order',
        });
    }
};

export const verifyPayment = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

        // Verify signature
        const isValid = verifyPaymentSignature(
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature
        );

        if (!isValid) {
            res.status(400).json({
                success: false,
                message: 'Invalid payment signature',
            });
            return;
        }

        // Update payment record
        const payment = await Payment.findOneAndUpdate(
            { razorpayOrderId },
            {
                razorpayPaymentId,
                razorpaySignature,
                status: 'captured',
            },
            { new: true }
        );

        if (!payment) {
            res.status(404).json({
                success: false,
                message: 'Payment record not found',
            });
            return;
        }

        // Update booking status
        await Booking.findByIdAndUpdate(payment.bookingId, {
            status: 'confirmed',
            paymentId: payment._id,
        });

        res.status(200).json({
            success: true,
            message: 'Payment verified successfully',
            data: payment,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to verify payment',
        });
    }
};


export const handleWebhook = async (req: Request, res: Response): Promise<void> => {
    try {
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
        if (!secret) {
            console.error('RAZORPAY_WEBHOOK_SECRET not defined');
            res.status(500).json({ success: false });
            return;
        }

        const signature = req.headers['x-razorpay-signature'] as string;
        const body = JSON.stringify(req.body);

        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(body)
            .digest('hex');

        if (signature !== expectedSignature) {
            console.error('Invalid webhook signature');
            res.status(400).json({ success: false });
            return;
        }

        const event = req.body;

        if (event.event === 'payment.captured') {
            const paymentEntity = event.payload.payment.entity;
            const orderId = paymentEntity.order_id;

            // Find payment by order ID
            const payment = await Payment.findOne({ razorpayOrderId: orderId });

            if (payment && payment.status !== 'captured') {
                payment.status = 'captured';
                payment.razorpayPaymentId = paymentEntity.id;
                payment.razorpaySignature = signature; // Store webhook sig as proof
                await payment.save();

                // Update booking
                await Booking.findByIdAndUpdate(payment.bookingId, {
                    status: 'confirmed',
                    paymentId: payment._id,
                });
            }
        } else if (event.event === 'payment.failed') {
            // Handle failure logic if needed
        }

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Webhook Error:', error);
        res.status(500).json({ success: false });
    }
};

export const requestRefund = async (req: AuthRequest, res: Response): Promise<void> => {
    // refund logic implementation using razorpay instance
    // ...
    res.status(501).json({ success: false, message: 'Refunds not yet implemented' });
};

export const getPaymentDetails = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const payment = await Payment.findById(req.params.id)
            .populate('userId', 'name email')
            .populate('bookingId');

        if (!payment) {
            res.status(404).json({
                success: false,
                message: 'Payment not found',
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: payment,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch payment details',
        });
    }
};
