import { Response } from 'express';
import MessPlan from '../models/MessPlan';
import { AuthRequest } from '../middleware/auth';

export const getAllMessPlans = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { city, minPrice, maxPrice, serviceType } = req.query;

        const filter: any = {
            isApproved: true,
            isActive: true,
        };

        if (city) {
            filter['location.city'] = { $regex: city, $options: 'i' };
        }

        if (minPrice || maxPrice) {
            filter.monthlyPrice = {};
            if (minPrice) filter.monthlyPrice.$gte = Number(minPrice);
            if (maxPrice) filter.monthlyPrice.$lte = Number(maxPrice);
        }

        if (serviceType) {
            filter.serviceType = { $in: [serviceType, 'both'] };
        }

        const messPlans = await MessPlan.find(filter)
            .populate('ownerId', 'name email phone')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: messPlans.length,
            data: messPlans,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch mess plans',
        });
    }
};

export const getMessPlanById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const messPlan = await MessPlan.findById(req.params.id).populate(
            'ownerId',
            'name email phone'
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
            data: messPlan,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch mess plan details',
        });
    }
};

export const createMessPlan = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const {
            providerName,
            description,
            monthlyPrice,
            menu,
            location,
            mealTimings,
            includedMeals,
            serviceType,
            images,
        } = req.body;

        const messPlan = await MessPlan.create({
            providerName,
            description,
            monthlyPrice,
            menu,
            location,
            mealTimings,
            includedMeals,
            serviceType,
            images: images || [],
            ownerId: req.user?._id,
        });

        res.status(201).json({
            success: true,
            message: 'Mess plan created successfully. Pending admin approval.',
            data: messPlan,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create mess plan',
        });
    }
};

export const updateMessPlan = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const messPlan = await MessPlan.findById(req.params.id);

        if (!messPlan) {
            res.status(404).json({
                success: false,
                message: 'Mess plan not found',
            });
            return;
        }

        // Check if user is the owner
        if (messPlan.ownerId.toString() !== req.user?._id.toString()) {
            res.status(403).json({
                success: false,
                message: 'Not authorized to update this mess plan',
            });
            return;
        }

        const updatedMessPlan = await MessPlan.findByIdAndUpdate(
            req.params.id,
            { ...req.body, isApproved: false }, // Reset approval on update
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: 'Mess plan updated successfully. Pending admin approval.',
            data: updatedMessPlan,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to update mess plan',
        });
    }
};

export const deleteMessPlan = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const messPlan = await MessPlan.findById(req.params.id);

        if (!messPlan) {
            res.status(404).json({
                success: false,
                message: 'Mess plan not found',
            });
            return;
        }

        // Check if user is the owner
        if (messPlan.ownerId.toString() !== req.user?._id.toString()) {
            res.status(403).json({
                success: false,
                message: 'Not authorized to delete this mess plan',
            });
            return;
        }

        await MessPlan.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: 'Mess plan deleted successfully',
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to delete mess plan',
        });
    }
};

export const getOwnerMessPlans = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const messPlans = await MessPlan.find({ ownerId: req.user?._id }).sort({
            createdAt: -1,
        });

        res.status(200).json({
            success: true,
            count: messPlans.length,
            data: messPlans,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch your mess plans',
        });
    }
};
