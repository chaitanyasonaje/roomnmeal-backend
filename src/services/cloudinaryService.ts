import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
    console.log('☁️  Cloudinary initialized');
} else {
    console.warn('⚠️ Cloudinary not configured');
}

export interface CloudinaryUploadResult {
    url: string;
    public_id: string;
}

export const uploadImage = async (
    file: string,
    folder: string = 'roomnmeal'
): Promise<CloudinaryUploadResult> => {
    try {
        const result = await cloudinary.uploader.upload(file, {
            folder,
            resource_type: 'auto',
        });

        return {
            url: result.secure_url,
            public_id: result.public_id,
        };
    } catch (error) {
        throw new Error('Image upload failed');
    }
};

export const uploadMultipleImages = async (
    files: string[],
    folder: string = 'roomnmeal'
): Promise<CloudinaryUploadResult[]> => {
    try {
        const uploadPromises = files.map((file) => uploadImage(file, folder));
        return await Promise.all(uploadPromises);
    } catch (error) {
        throw new Error('Multiple image upload failed');
    }
};

export const deleteImage = async (publicId: string): Promise<void> => {
    try {
        await cloudinary.uploader.destroy(publicId);
    } catch (error) {
        throw new Error('Image deletion failed');
    }
};

export default cloudinary;
