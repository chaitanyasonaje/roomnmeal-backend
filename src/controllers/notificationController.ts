import { Request, Response } from 'express';
import Notification, { INotification } from '../models/Notification';
import { AuthRequest } from '../middleware/auth';
import mongoose from 'mongoose';

// Internal helper to create notification (not an API endpoint)
export const createNotification = async (
    userId: mongoose.Types.ObjectId | string,
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' = 'info',
    relatedId?: mongoose.Types.ObjectId | string,
    relatedModel?: string
) => {
    try {
        await Notification.create({
            userId,
            title,
            message,
            type,
            relatedId,
            relatedModel,
        });
    } catch (error) {
        console.error('Failed to create notification:', error);
    }
};

export const getMyNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const notifications = await Notification.find({ userId: req.user?._id })
            .sort({ createdAt: -1 })
            .limit(50); // Limit to last 50 notifications

        // Count unread
        const unreadCount = await Notification.countDocuments({
            userId: req.user?._id,
            isRead: false
        });

        res.status(200).json({
            success: true,
            count: notifications.length,
            unreadCount,
            data: notifications,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch notifications',
        });
    }
};

export const markAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const notification = await Notification.findOneAndUpdate(
            { _id: id, userId: req.user?._id },
            { isRead: true },
            { new: true }
        );

        if (!notification) {
            res.status(404).json({
                success: false,
                message: 'Notification not found',
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: notification,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to update notification',
        });
    }
};

export const markAllAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        await Notification.updateMany(
            { userId: req.user?._id, isRead: false },
            { isRead: true }
        );

        res.status(200).json({
            success: true,
            message: 'All notifications marked as read',
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to update notifications',
        });
    }
};

// Endpoint to create a test notification manually (for development/admin)
export const sendTestNotification = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { userId, title, message, type } = req.body;

        await createNotification(
            userId || req.user?._id, // Default to self if no userId provided
            title,
            message,
            type
        );

        res.status(201).json({
            success: true,
            message: 'Notification sent successfully',
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to send notification',
        });
    }
};
