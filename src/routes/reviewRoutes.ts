import express from 'express';
import { createReview, getReviews, getMyReview, deleteReview } from '../controllers/reviewController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Public: get reviews for a room/mess
router.get('/:targetType/:targetId', getReviews);

// Authenticated: create/update review
router.post('/', authenticate, createReview);

// Authenticated: get my review for a specific target
router.get('/my/:targetType/:targetId', authenticate, getMyReview);

// Authenticated: delete review
router.delete('/:id', authenticate, deleteReview);

export default router;
