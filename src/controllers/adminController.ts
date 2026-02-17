import { Response } from 'express';
import Room from '../models/Room';
import MessPlan from '../models/MessPlan';
import Service from '../models/Service';
import User from '../models/User';
import Booking from '../models/Booking';
import Complaint from '../models/Complaint';
import Payment from '../models/Payment';
import { AuthRequest } from '../middleware/auth';

export const getListings = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { status } = req.query;
        const filter: any = {};

        if (status === 'pending') {
            filter.isApproved = { $ne: true };
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

        const services = await Service.find(filter)
            .populate('ownerId', 'name email phone')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: {
                rooms,
                mess: messPlans,
                services,
                total: rooms.length + messPlans.length + services.length,
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

        if (type === 'room' || type === 'rooms') {
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
        } else if (type === 'service' || type === 'services') {
            const service = await Service.findByIdAndUpdate(
                id,
                { isApproved: true },
                { new: true }
            );

            if (!service) {
                res.status(404).json({
                    success: false,
                    message: 'Service not found',
                });
                return;
            }

            res.status(200).json({
                success: true,
                message: 'Service approved successfully',
                data: service,
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

        if (type === 'room' || type === 'rooms') {
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
        } else if (type === 'service' || type === 'services') {
            const service = await Service.findByIdAndUpdate(
                id,
                { isActive: false },
                { new: true }
            );

            if (!service) {
                res.status(404).json({
                    success: false,
                    message: 'Service not found',
                });
                return;
            }

            res.status(200).json({
                success: true,
                message: 'Service rejected successfully',
                data: service,
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
        const totalServices = await Service.countDocuments({ isApproved: true });
        const pendingRooms = await Room.countDocuments({ isApproved: { $ne: true }, isActive: true });
        const pendingMessPlans = await MessPlan.countDocuments({ isApproved: { $ne: true }, isActive: true });
        const pendingServices = await Service.countDocuments({ isApproved: { $ne: true }, isActive: true });
        const totalBookings = await Booking.countDocuments();

        // Count complaints
        const totalComplaints = await Complaint.countDocuments();
        const pendingComplaints = await Complaint.countDocuments({ status: 'pending' });

        res.status(200).json({
            success: true,
            data: {
                totalUsers,
                totalRooms,
                totalMess: totalMessPlans,
                totalServices,
                pendingRooms,
                pendingMess: pendingMessPlans,
                pendingServices,
                activeListings: totalRooms + totalMessPlans + totalServices,
                totalPending: pendingRooms + pendingMessPlans + pendingServices,
                totalBookings,
                totalComplaints,
                pendingComplaints
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

export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userIdToDelete = req.params.id;
        const currentAdminId = req.user?._id;

        if (!currentAdminId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }

        if (userIdToDelete === currentAdminId.toString()) {
            res.status(400).json({
                success: false,
                message: 'You cannot delete your own admin account',
            });
            return;
        }

        const user = await User.findByIdAndDelete(userIdToDelete);

        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User not found',
            });
            return;
        }

        // Optional: We could also delete associated data (Rooms, Complaints, etc.) here
        // or rely on cascading deletes if configured, or leave them as orphaned/inactive.
        // For this MVP, we'll just delete the user.

        res.status(200).json({
            success: true,
            message: 'User deleted successfully',
            data: {},
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to delete user',
        });
    }
};

export const deleteListing = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { type, id } = req.params;

        let deletedItem;
        if (type === 'room' || type === 'rooms') {
            deletedItem = await Room.findByIdAndDelete(id);
        } else if (type === 'mess') {
            deletedItem = await MessPlan.findByIdAndDelete(id);
        } else if (type === 'service' || type === 'services') {
            deletedItem = await Service.findByIdAndDelete(id);
        } else {
            res.status(400).json({
                success: false,
                message: 'Invalid listing type',
            });
            return;
        }

        if (!deletedItem) {
            res.status(404).json({
                success: false,
                message: `${type.charAt(0).toUpperCase() + type.slice(1)} not found`,
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'Listing deleted successfully',
            data: {},
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to delete listing',
        });
    }
};

export const getAllPayments = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const payments = await Payment.find()
            .populate('userId', 'name email phone')
            .populate('bookingId')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: payments,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch payments',
        });
    }
};

export const getAllBookings = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const bookings = await Booking.find()
            .populate('userId', 'name email phone')
            .populate('roomId', 'title location price')
            .populate('messPlanId', 'name price')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: bookings,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch bookings',
        });
    }
};
