import { Request, Response } from 'express';
import Complaint from '../models/Complaint';
import { AuthRequest } from '../middleware/auth';

export const createComplaint = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { category, title, description } = req.body;

        // Handle image upload (if any)
        // Since we are using single file upload middleware for profile, we might need to adjust for multiple images later.
        // For now, let's assume one image is uploaded via 'image' field if any, or just URL if passed directly.
        // But the middleware in routes will handle 'file'.

        let imageUrl = '';
        if (req.file) {
            // In a real app with Cloudinary, this would be the secure_url.
            // With local upload, it's the path.
            imageUrl = `/uploads/${req.file.filename}`;
        }

        const complaint = await Complaint.create({
            userId: req.user?._id,
            category,
            title,
            description,
            images: imageUrl ? [imageUrl] : [],
        });

        res.status(201).json({
            success: true,
            message: 'Complaint raised successfully',
            data: complaint,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to raise complaint',
        });
    }
};

export const getMyComplaints = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const complaints = await Complaint.find({ userId: req.user?._id })
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: complaints.length,
            data: complaints,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch complaints',
        });
    }
};

export const getAllComplaints = async (req: Request, res: Response): Promise<void> => {
    try {
        const complaints = await Complaint.find()
            .populate('userId', 'name email roomNumber')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: complaints.length,
            data: complaints,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch complaints',
        });
    }
};

export const updateComplaintStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const { status, adminComment } = req.body;

        const complaint = await Complaint.findByIdAndUpdate(
            req.params.id,
            { status, adminComment },
            { new: true, runValidators: true }
        );

        if (!complaint) {
            res.status(404).json({
                success: false,
                message: 'Complaint not found',
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'Complaint updated successfully',
            data: complaint,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to update complaint',
        });
    }
};
