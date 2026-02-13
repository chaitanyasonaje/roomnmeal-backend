import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { uploadImage as uploadToCloudinary, uploadMultipleImages as uploadMultipleToCloudinary } from '../services/cloudinaryService';

// Configure storage for local fallback
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../../uploads');
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Unique filename: fieldname-timestamp-random.ext
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter (images only)
const fileFilter = (req: any, file: any, cb: any) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Not an image! Please upload an image.'), false);
    }
};

export const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

export const uploadImage = async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        // Check if Cloudinary is configured
        if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
            console.error('Cloudinary not configured');
            // In production, we must not fall back to local storage which is ephemeral
            return res.status(500).json({ success: false, message: 'Upload service not configured' });
        }

        try {
            const result = await uploadToCloudinary(req.file.path);
            // Clean up local file after cloud upload
            fs.unlinkSync(req.file.path);
            return res.status(200).json({
                success: true,
                message: 'Image uploaded to cloud successfully',
                url: result.url,
            });
        } catch (cloudError) {
            console.error('Cloudinary upload failed:', cloudError);
            // Clean up local file 
            if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
            return res.status(500).json({ success: false, message: 'Image upload failed' });
        }
    } catch (error: any) {
        // Clean up if error occurs before upload attempt (though multer handles this mostly)
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const uploadMultipleImages = async (req: Request, res: Response) => {
    try {
        if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
            return res.status(400).json({ success: false, message: 'No files uploaded' });
        }

        const files = req.files as Express.Multer.File[];

        // Check if Cloudinary is configured
        if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
            console.error('Cloudinary not configured');
            return res.status(500).json({ success: false, message: 'Upload service not configured' });
        }

        try {
            const filePaths = files.map(file => file.path);
            const results = await uploadMultipleToCloudinary(filePaths);

            // Clean up local files
            files.forEach(file => {
                if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
            });

            return res.status(200).json({
                success: true,
                message: 'Images uploaded to cloud successfully',
                urls: results.map(r => r.url),
            });
        } catch (cloudError) {
            console.error('Cloudinary upload failed:', cloudError);
            // Clean up local files
            files.forEach(file => {
                if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
            });
            return res.status(500).json({ success: false, message: 'Multiple image upload failed' });
        }
    } catch (error: any) {
        // Clean up on error
        if (req.files) {
            (req.files as Express.Multer.File[]).forEach(file => {
                if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
            });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};
