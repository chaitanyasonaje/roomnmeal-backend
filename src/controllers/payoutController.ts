import { Response } from 'express';
import Payout from '../models/Payout';
import Booking from '../models/Booking';
import Room from '../models/Room';
import MessPlan from '../models/MessPlan';
import { AuthRequest } from '../middleware/auth';

export const requestPayout = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { amount } = req.body;
        const ownerId = req.user?._id;

        if (!amount || amount < 1) {
            res.status(400).json({ success: false, message: 'Invalid payout amount' });
            return;
        }

        // Calculate available earnings
        const rooms = await Room.find({ ownerId });
        const messPlans = await MessPlan.find({ ownerId });

        const roomIds = rooms.map(r => r._id);
        const messPlanIds = messPlans.map(m => m._id);

        const bookings = await Booking.find({
            status: 'confirmed',
            $or: [
                { roomId: { $in: roomIds } },
                { messPlanId: { $in: messPlanIds } }
            ]
        });

        const totalEarnings = bookings.reduce((sum, b) => sum + b.totalAmount, 0);

        // Calculate already processed/pending payouts
        const processedPayouts = await Payout.find({
            ownerId,
            status: { $in: ['pending', 'processing', 'paid'] }
        });

        const totalWithdrawn = processedPayouts.reduce((sum, p) => sum + p.amount, 0);

        const availableBalance = totalEarnings - totalWithdrawn;

        if (amount > availableBalance) {
            res.status(400).json({
                success: false,
                message: `Insufficient balance. Available: ₹${availableBalance}`,
            });
            return;
        }

        // Check if user has bank details
        const user = req.user as any;
        if (!user.bankDetails || (!user.bankDetails.accountNumber && !user.bankDetails.upiId)) {
            res.status(400).json({
                success: false,
                message: 'Please add bank details or UPI ID in your profile before requesting a payout',
            });
            return;
        }

        const payout = await Payout.create({
            ownerId,
            amount,
            status: 'pending',
        });

        res.status(201).json({
            success: true,
            message: 'Payout request submitted successfully',
            data: payout,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to request payout',
        });
    }
};

export const getMyPayouts = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const payouts = await Payout.find({ ownerId: req.user?._id }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: payouts.length,
            data: payouts,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch payouts',
        });
    }
};

// Admin Endpoints
export const getAllPayoutRequests = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const payouts = await Payout.find()
            .populate('ownerId', 'name email phone bankDetails')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: payouts.length,
            data: payouts,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch payout requests',
        });
    }
};

export const updatePayoutStatus = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { status, transactionId, adminNotes } = req.body;
        const payoutId = req.params.id;

        const payout = await Payout.findById(payoutId);

        if (!payout) {
            res.status(404).json({ success: false, message: 'Payout request not found' });
            return;
        }

        if (status === 'paid') {
            payout.status = 'paid';
            payout.processedAt = new Date();
            payout.transactionId = transactionId;
        } else if (status === 'rejected') {
            payout.status = 'rejected';
        } else if (status === 'processing') {
            payout.status = 'processing';
        }

        if (adminNotes) payout.adminNotes = adminNotes;

        await payout.save();

        res.status(200).json({
            success: true,
            message: `Payout status updated to ${status}`,
            data: payout,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to update payout status',
        });
    }
};
