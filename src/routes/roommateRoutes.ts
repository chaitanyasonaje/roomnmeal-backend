import express from 'express';
import { authenticate } from '../middleware/auth';
import { upsertProfile, getMyProfile, getMatches } from '../controllers/roommateController';

const router = express.Router();

router.post('/', authenticate, upsertProfile); // Create or Update
router.get('/me', authenticate, getMyProfile); // Get My Profile
router.get('/matches', authenticate, getMatches); // Get Matches

export default router;
