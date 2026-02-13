import express from 'express';
import {
    getAllMessPlans,
    getMessPlanById,
    createMessPlan,
    updateMessPlan,
    deleteMessPlan,
    getOwnerMessPlans,
} from '../controllers/messController';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/roleCheck';

const router = express.Router();

// Public routes
router.get('/', getAllMessPlans);
router.get('/:id', getMessPlanById);

// Owner routes
router.post('/', authenticate, authorize('owner'), createMessPlan);
router.put('/:id', authenticate, authorize('owner'), updateMessPlan);
router.delete('/:id', authenticate, authorize('owner'), deleteMessPlan);
router.get('/owner/my-mess-plans', authenticate, authorize('owner'), getOwnerMessPlans);

export default router;
