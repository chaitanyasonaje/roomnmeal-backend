import { Response } from 'express';
import Room from '../models/Room';
import { AuthRequest } from '../middleware/auth';
import { uploadMultipleImages } from '../services/cloudinaryService';

const escapeRegex = (text: string) => {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
};

export const getAllRooms = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { city, minPrice, maxPrice, roomType, gender } = req.query;

        const filter: any = {
            isApproved: true,
            isActive: true,
        };

        if (city && typeof city === 'string') {
            filter['location.city'] = { $regex: escapeRegex(city), $options: 'i' };
        }

        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice) filter.price.$gte = Number(minPrice);
            if (maxPrice) filter.price.$lte = Number(maxPrice);
        }

        if (roomType) {
            filter.roomType = roomType;
        }

        if (gender) {
            filter.gender = { $in: [gender, 'any'] };
        }

        const rooms = await Room.find(filter)
            .populate('ownerId', 'name email phone')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: rooms.length,
            data: rooms,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch rooms',
        });
    }
};

export const getRoomById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const room = await Room.findById(req.params.id).populate(
            'ownerId',
            'name email phone'
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
            data: room,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch room details',
        });
    }
};

export const createRoom = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const {
            title,
            description,
            price,
            deposit,
            location,
            facilities,
            roomType,
            gender,
            availableFrom,
            images,
        } = req.body;

        // Upload images to Cloudinary if provided as base64, otherwise use as is
        let imageUrls: string[] = [];
        if (images && images.length > 0) {
            if (images[0].startsWith('data:')) {
                const uploadResults = await uploadMultipleImages(images, 'roomnmeal/rooms');
                imageUrls = uploadResults.map((result) => result.url);
            } else {
                imageUrls = images;
            }
        }

        const room = await Room.create({
            title,
            description,
            price,
            deposit,
            location,
            images: imageUrls,
            facilities,
            roomType,
            gender,
            availableFrom,
            ownerId: req.user?._id,
        });

        res.status(201).json({
            success: true,
            message: 'Room listing created successfully. Pending admin approval.',
            data: room,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create room listing',
        });
    }
};

export const updateRoom = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const room = await Room.findById(req.params.id);

        if (!room) {
            res.status(404).json({
                success: false,
                message: 'Room not found',
            });
            return;
        }

        // Check if user is the owner
        if (room.ownerId.toString() !== req.user?._id.toString()) {
            res.status(403).json({
                success: false,
                message: 'Not authorized to update this room',
            });
            return;
        }

        const updatedRoom = await Room.findByIdAndUpdate(
            req.params.id,
            { ...req.body, isApproved: false }, // Reset approval on update
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: 'Room updated successfully. Pending admin approval.',
            data: updatedRoom,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to update room',
        });
    }
};

export const deleteRoom = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const room = await Room.findById(req.params.id);

        if (!room) {
            res.status(404).json({
                success: false,
                message: 'Room not found',
            });
            return;
        }

        // Check if user is the owner
        if (room.ownerId.toString() !== req.user?._id.toString()) {
            res.status(403).json({
                success: false,
                message: 'Not authorized to delete this room',
            });
            return;
        }

        await Room.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: 'Room deleted successfully',
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to delete room',
        });
    }
};

export const getOwnerRooms = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const rooms = await Room.find({ ownerId: req.user?._id }).sort({
            createdAt: -1,
        });

        res.status(200).json({
            success: true,
            count: rooms.length,
            data: rooms,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch your rooms',
        });
    }
};
