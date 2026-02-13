import express from 'express';
import { getAllServices, createServiceRequest, getMyServiceRequests, seedServices, createService, getOwnerServices, updateService, deleteService, verifyServiceOtp } from '../controllers/serviceController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Owner routes
router.get('/my-services', authenticate, getOwnerServices);
router.post('/create', authenticate, createService);
router.put('/:id', authenticate, updateService);
router.delete('/:id', authenticate, deleteService);

// Student routes
router.get('/', getAllServices);
router.post('/request', authenticate, createServiceRequest);
router.post('/verify-otp', authenticate, verifyServiceOtp);
router.get('/my-requests', authenticate, getMyServiceRequests);

// Seed
router.post('/seed', seedServices);

export default router;
