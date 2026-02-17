import express from 'express';
import { getAllServices, createServiceRequest, getMyServiceRequests, createService, getOwnerServices, updateService, deleteService, verifyServiceOtp, getOwnerServiceRequests } from '../controllers/serviceController';
import { authenticate } from '../middleware/auth';
import { validate, createServiceRules, createServiceRequestRules, mongoIdParam } from '../middleware/validators';

const router = express.Router();

// Owner routes
router.get('/my-services', authenticate, getOwnerServices);
router.get('/owner-requests', authenticate, getOwnerServiceRequests);
router.post('/create', authenticate, createServiceRules, validate, createService);
router.put('/:id', authenticate, mongoIdParam(), validate, updateService);
router.delete('/:id', authenticate, mongoIdParam(), validate, deleteService);

// Student routes
router.get('/', getAllServices);
router.post('/request', authenticate, createServiceRequestRules, validate, createServiceRequest);
router.post('/verify-otp', authenticate, verifyServiceOtp);
router.get('/my-requests', authenticate, getMyServiceRequests);

export default router;

