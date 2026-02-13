import { Request, Response } from 'express';
import Review from '../models/Review';
import mongoose from 'mongoose';

// Create or update a review
export const createReview = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user._id;
        const { targetType, targetId, rating, comment } = req.body;

        if (!targetType || !targetId || !rating) {
            return res.status(400).json({ success: false, message: 'targetType, targetId, and rating are required' });
        }

        // Upsert: create or update existing review
        const review = await Review.findOneAndUpdate(
            { userId, targetType, targetId },
            { rating, comment: comment || '' },
            { new: true, upsert: true, runValidators: true }
        );

        res.status(201).json({ success: true, data: review });
    } catch (error: any) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'You have already reviewed this item' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get reviews for a specific target (room or mess)
export const getReviews = async (req: Request, res: Response) => {
    try {
        const { targetType, targetId } = req.params;

        const reviews = await Review.find({ targetType, targetId })
            .populate('userId', 'name profilePicture')
            .sort({ createdAt: -1 });

        // Calculate average rating
        const totalRatings = reviews.length;
        const avgRating = totalRatings > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalRatings
            : 0;

        // Rating distribution
        const distribution: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        reviews.forEach(r => { distribution[r.rating] = (distribution[r.rating] || 0) + 1; });

        res.json({
            success: true,
            data: reviews,
            stats: {
                avgRating: Math.round(avgRating * 10) / 10,
                totalRatings,
                distribution,
            },
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get current user's review for a target
export const getMyReview = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user._id;
        const { targetType, targetId } = req.params;

        const review = await Review.findOne({ userId, targetType, targetId });
        res.json({ success: true, data: review });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete a review
export const deleteReview = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user._id;
        const review = await Review.findOne({ _id: req.params.id, userId });

        if (!review) {
            return res.status(404).json({ success: false, message: 'Review not found' });
        }

        await review.deleteOne();
        res.json({ success: true, message: 'Review deleted' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
