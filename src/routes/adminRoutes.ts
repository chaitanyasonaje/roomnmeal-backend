import express from 'express';
import {
    getListings,
    approveListing,
    rejectListing,
    getAdminStats,
    getAllUsers,
} from '../controllers/adminController';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/roleCheck';

const router = express.Router();

router.get('/listings', authenticate, authorize('admin'), getListings);
router.get('/stats', authenticate, authorize('admin'), getAdminStats);
router.get('/users', authenticate, authorize('admin'), getAllUsers);
router.put('/approve/:type/:id', authenticate, authorize('admin'), approveListing);
router.put('/reject/:type/:id', authenticate, authorize('admin'), rejectListing);

export default router;
