import { Response } from 'express';
import Room from '../models/Room';
import MessPlan from '../models/MessPlan';
import User from '../models/User';
import Booking from '../models/Booking';
import { AuthRequest } from '../middleware/auth';

export const getListings = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { status } = req.query;
        const filter: any = {};

        if (status === 'pending') {
            filter.isApproved = false;
            filter.isActive = true; // Only show active requests (not rejected ones)
        } else if (status === 'active') {
            filter.isApproved = true;
            filter.isActive = true;
        } else if (status === 'rejected') {
            filter.isActive = false; // Assuming rejected = isActive: false
        }

        const rooms = await Room.find(filter)
            .populate('ownerId', 'name email phone')
            .sort({ createdAt: -1 });

        const messPlans = await MessPlan.find(filter)
            .populate('ownerId', 'name email phone')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: {
                rooms,
                mess: messPlans,
                total: rooms.length + messPlans.length,
            },
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch listings',
        });
    }
};

export const approveListing = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { type, id } = req.params;

        if (type === 'room') {
            const room = await Room.findByIdAndUpdate(
                id,
                { isApproved: true },
                { new: true }
            );

            if (!room) {
                res.status(404).json({
                    success: false,
                    message: 'Room not found',
                });
                return;
            }

            res.status(200).json({
                success: true,
                message: 'Room approved successfully',
                data: room,
            });
        } else if (type === 'mess') {
            const messPlan = await MessPlan.findByIdAndUpdate(
                id,
                { isApproved: true },
                { new: true }
            );

            if (!messPlan) {
                res.status(404).json({
                    success: false,
                    message: 'Mess plan not found',
                });
                return;
            }

            res.status(200).json({
                success: true,
                message: 'Mess plan approved successfully',
                data: messPlan,
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Invalid listing type',
            });
        }
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to approve listing',
        });
    }
};

export const rejectListing = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { type, id } = req.params;

        if (type === 'room') {
            const room = await Room.findByIdAndUpdate(
                id,
                { isActive: false },
                { new: true }
            );

            if (!room) {
                res.status(404).json({
                    success: false,
                    message: 'Room not found',
                });
                return;
            }

            res.status(200).json({
                success: true,
                message: 'Room rejected successfully',
                data: room,
            });
        } else if (type === 'mess') {
            const messPlan = await MessPlan.findByIdAndUpdate(
                id,
                { isActive: false },
                { new: true }
            );

            if (!messPlan) {
                res.status(404).json({
                    success: false,
                    message: 'Mess plan not found',
                });
                return;
            }

            res.status(200).json({
                success: true,
                message: 'Mess plan rejected successfully',
                data: messPlan,
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Invalid listing type',
            });
        }
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to reject listing',
        });
    }
};

export const getAdminStats = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const totalUsers = await User.countDocuments();
        const totalRooms = await Room.countDocuments({ isApproved: true });
        const totalMessPlans = await MessPlan.countDocuments({ isApproved: true });
        const pendingRooms = await Room.countDocuments({ isApproved: false, isActive: true });
        const pendingMessPlans = await MessPlan.countDocuments({ isApproved: false, isActive: true });
        const totalBookings = await Booking.countDocuments();

        res.status(200).json({
            success: true,
            data: {
                totalUsers,
                activeListings: totalRooms + totalMessPlans,
                totalPending: pendingRooms + pendingMessPlans,
                totalBookings,
            },
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch admin stats',
        });
    }
};

export const getAllUsers = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const users = await User.find().sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            data: users,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch users',
        });
    }
};
