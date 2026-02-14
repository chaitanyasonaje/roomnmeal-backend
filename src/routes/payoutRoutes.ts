import express from 'express';
import {
    requestPayout,
    getMyPayouts,
    getAllPayoutRequests,
    updatePayoutStatus
} from '../controllers/payoutController';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

// Owner routes
router.post('/request', authenticate, authorize('owner'), requestPayout);
router.get('/my-payouts', authenticate, authorize('owner'), getMyPayouts);

// Admin routes
router.get('/admin/all', authenticate, authorize('admin'), getAllPayoutRequests);
router.put('/admin/:id', authenticate, authorize('admin'), updatePayoutStatus);

export default router;
