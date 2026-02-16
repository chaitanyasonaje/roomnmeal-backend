import { Response, Request } from 'express';
import Payment from '../models/Payment';
import crypto from 'crypto';
import Booking from '../models/Booking';
import { AuthRequest } from '../middleware/auth';
import { createOrder, verifyPaymentSignature, refundPayment } from '../services/razorpayService';

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
        // SECURITY FIX: Use rawBody for signature verification
        const body = (req as any).rawBody;

        if (!body) {
            console.error('Missing raw body for webhook verification');
            res.status(400).json({ success: false });
            return;
        }

        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(body)
            .digest('hex');

        if (
            signature.length !== expectedSignature.length ||
            signature.length !== expectedSignature.length ||
            !crypto.timingSafeEqual(
                Buffer.from(signature),
                Buffer.from(expectedSignature)
            )
        ) {
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
    try {
        const { paymentId, reason } = req.body;
        const userId = req.user?._id;

        const payment = await Payment.findById(paymentId);
        if (!payment) {
            res.status(404).json({ success: false, message: 'Payment not found' });
            return;
        }

        // Only allow admins or the user who made the payment to request refund?
        // Usually refunds are admin-initiated or require approval. 
        // For MVP, let's say only Admin can process a refund directly, OR user requests it and it goes to 'refund_requested' status.
        // User requesting:
        if (req.user?.role !== 'admin') {
            // If user, just mark as requested?
            // payment.status = 'refund_requested';
            // payment.refundReason = reason;
            // await payment.save();
            // res.status(200).json({ success: true, message: 'Refund requested successfully' });
            // return;

            // Check if user owns the payment
            if (payment.userId.toString() !== userId.toString()) {
                res.status(403).json({ success: false, message: 'Not authorized' });
                return;
            }
        }

        // If Admin, process immediately? Or if we want to allow automatic full refunds for testing.
        // Let's implement immediate refund for Admin for now.

        if (req.user?.role !== 'admin') {
            res.status(403).json({ success: false, message: 'Only admins can process refunds currently' });
            return;
        }

        if (!payment.razorpayPaymentId) {
            res.status(400).json({ success: false, message: 'Payment ID not found for this transaction' });
            return;
        }

        const refund = await refundPayment(payment.razorpayPaymentId);

        payment.status = 'refunded';
        await payment.save();

        // Update booking status
        await Booking.findByIdAndUpdate(payment.bookingId, { status: 'cancelled' });

        res.status(200).json({ success: true, message: 'Refund processed successfully', data: refund });

    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message || 'Refund failed' });
    }
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

        // SECURITY FIX: IDOR Prevention
        if (payment.userId._id.toString() !== req.user?._id.toString() && req.user?.role !== 'admin') {
            res.status(403).json({
                success: false,
                message: 'Not authorized to view this payment record',
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
