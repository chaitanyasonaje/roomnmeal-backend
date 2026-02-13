import express from 'express';
import { upload, uploadImage, uploadMultipleImages } from '../controllers/uploadController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Upload single image
router.post('/', authenticate, upload.single('image'), uploadImage);

// Upload multiple images
router.post('/multiple', authenticate, upload.array('images', 10), uploadMultipleImages);

export default router;
