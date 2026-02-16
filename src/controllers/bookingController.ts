import { Response } from 'express';
import Booking from '../models/Booking';
import Room from '../models/Room';
import MessPlan from '../models/MessPlan';
import { AuthRequest } from '../middleware/auth';
import { createOrder } from '../services/razorpayService';
import { sendPushNotification } from '../services/notificationService';

export const createBooking = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { bookingType, roomId, messPlanId, startDate, durationInMonths } = req.body;

        let start = new Date(startDate);
        if (isNaN(start.getTime())) start = new Date(); // Default to now if invalid

        let end: Date | undefined;
        let totalAmount = 0;
        const duration = durationInMonths || 1;

        let room: any = null;
        let messPlan: any = null;

        // Calculate amount based on booking type
        if (bookingType === 'room' && roomId) {
            room = await Room.findById(roomId);
            if (!room || !room.isApproved || !room.isActive) {
                res.status(400).json({
                    success: false,
                    message: 'Room not available for booking',
                });
                return;
            }
            // For room: Deposit + 1st Month Rent
            totalAmount = room.price + room.deposit;

            // Calculate end date
            end = new Date(start);
            end.setMonth(end.getMonth() + duration);

        } else if (bookingType === 'mess' && messPlanId) {
            messPlan = await MessPlan.findById(messPlanId);
            if (!messPlan || !messPlan.isApproved || !messPlan.isActive) {
                res.status(400).json({
                    success: false,
                    message: 'Mess plan not available for booking',
                });
                return;
            }
            // For mess: Plan Price * Duration (if paid upfront) or just subscription price
            totalAmount = messPlan.monthlyPrice;

            // Calculate end date (1 month default)
            end = new Date(start);
            end.setMonth(end.getMonth() + 1); // Default 1 month subscription
        } else {
            res.status(400).json({
                success: false,
                message: 'Invalid booking details',
            });
            return;
        }

        const booking = await Booking.create({
            userId: req.user?._id,
            bookingType,
            roomId: bookingType === 'room' ? roomId : undefined,
            messPlanId: bookingType === 'mess' ? messPlanId : undefined,
            startDate: start,
            endDate: end,
            durationInMonths: bookingType === 'room' ? duration : undefined,
            totalAmount,
            status: 'pending',
        });

        // NOTIFICATION: Notify Owner
        try {
            let ownerId;
            let title = 'New Booking Request';
            if (room) {
                ownerId = room.ownerId;
                title = `New Room Booking: ${room.title}`;
            } else if (messPlan) { // Use messPlan variable
                ownerId = messPlan.ownerId;
                title = `New Mess Subscription: ${messPlan.name}`; // Use messPlan.name or appropriate field
            }

            if (ownerId) {
                // The User model is not needed here for ownerId check, as ownerId is directly from room/messPlan
                // If User model was needed for other details, it should be imported at the top.

                await sendPushNotification(
                    ownerId.toString(),
                    title,
                    `You have a new booking request from ${req.user?.name}. Total: ₹${totalAmount}`,
                    { bookingId: booking._id.toString() } // Ensure booking._id is converted to string
                );
            }
        } catch (postBookingError) {
            console.error('Notification error:', postBookingError);
        }

        res.status(201).json({
            success: true,
            message: 'Booking created successfully. Please proceed to payment.', // Updated message
            data: booking,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create booking',
        });
    }
};

export const getMyBookings = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const bookings = await Booking.find({ userId: req.user?._id })
            .populate('roomId')
            .populate('messPlanId')
            .populate('paymentId')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: bookings.length,
            data: bookings,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch bookings',
        });
    }
};

export const getOwnerBookings = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        // Get all rooms and mess plans owned by the user
        const rooms = await Room.find({ ownerId: req.user?._id });
        const messPlans = await MessPlan.find({ ownerId: req.user?._id });

        const roomIds = rooms.map((room) => room._id);
        const messPlanIds = messPlans.map((plan) => plan._id);

        // Find bookings for these rooms and mess plans
        const bookings = await Booking.find({
            $or: [{ roomId: { $in: roomIds } }, { messPlanId: { $in: messPlanIds } }],
        })
            .populate('userId', 'name email phone')
            .populate('roomId')
            .populate('messPlanId')
            .populate('paymentId')
            .sort({ createdAt: -1 });

        // Calculate total earnings
        const totalEarnings = bookings
            .filter((booking) => booking.status === 'confirmed')
            .reduce((sum, booking) => sum + booking.totalAmount, 0);

        res.status(200).json({
            success: true,
            count: bookings.length,
            totalEarnings,
            data: bookings,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch bookings',
        });
    }
};

export const getBookingById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate('userId', 'name email phone')
            .populate('roomId')
            .populate('messPlanId')
            .populate('paymentId');

        if (!booking) {
            res.status(404).json({
                success: false,
                message: 'Booking not found',
            });
            return;
        }

        // SECURITY FIX: IDOR Prevention
        // Check if user is the booking owner, the resource owner (Room/Mess), or an admin
        const isBookingOwner = booking.userId._id.toString() === req.user?._id.toString();
        const isAdmin = req.user?.role === 'admin';

        let isResourceOwner = false;
        if (booking.roomId && (booking.roomId as any).ownerId) {
            isResourceOwner = (booking.roomId as any).ownerId.toString() === req.user?._id.toString();
        } else if (booking.messPlanId && (booking.messPlanId as any).ownerId) {
            isResourceOwner = (booking.messPlanId as any).ownerId.toString() === req.user?._id.toString();
        }

        if (!isBookingOwner && !isResourceOwner && !isAdmin) {
            res.status(403).json({
                success: false,
                message: 'Not authorized to view this booking',
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: booking,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch booking details',
        });
    }
};

export const cancelBooking = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const booking = await Booking.findById(req.params.id);

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
                message: 'Not authorized to cancel this booking',
            });
            return;
        }

        if (booking.status !== 'pending') {
            res.status(400).json({
                success: false,
                message: 'Cannot cancel this booking',
            });
            return;
        }

        booking.status = 'cancelled';
        await booking.save();

        res.status(200).json({
            success: true,
            message: 'Booking cancelled successfully',
            data: booking,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to cancel booking',
        });
    }
};

export const updateBookingStatus = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { status } = req.body;
        if (!['confirmed', 'cancelled'].includes(status)) {
            res.status(400).json({
                success: false,
                message: 'Invalid status. Must be confirmed or cancelled.',
            });
            return;
        }

        const booking = await Booking.findById(req.params.id)
            .populate('roomId')
            .populate('messPlanId');

        if (!booking) {
            res.status(404).json({
                success: false,
                message: 'Booking not found',
            });
            return;
        }

        // Verify ownership
        // Using 'any' cast because populate types can be tricky
        const room = booking.roomId as any;
        const mess = booking.messPlanId as any;

        let isOwner = false;
        if (booking.bookingType === 'room' && room) {
            isOwner = room.ownerId.toString() === req.user?._id.toString();
        } else if (booking.bookingType === 'mess' && mess) {
            isOwner = mess.ownerId.toString() === req.user?._id.toString();
        }

        if (!isOwner) {
            res.status(403).json({
                success: false,
                message: 'Not authorized to manage this booking',
            });
            return;
        }

        booking.status = status;
        await booking.save();

        res.status(200).json({
            success: true,
            message: `Booking ${status} successfully`,
            data: booking,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to update booking status',
        });
    }
};
