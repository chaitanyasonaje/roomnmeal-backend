import express from 'express';
import { createComplaint, getMyComplaints, getAllComplaints, updateComplaintStatus } from '../controllers/complaintController';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/roleCheck';
import { upload } from '../middleware/upload';
import { validate, createComplaintRules, mongoIdParam } from '../middleware/validators';

const router = express.Router();

// Student routes
router.post('/', authenticate, upload.single('image'), createComplaintRules, validate, createComplaint);
router.get('/my', authenticate, getMyComplaints);

// Admin routes
router.get('/all', authenticate, authorize('admin'), getAllComplaints);
router.put('/:id', authenticate, authorize('admin'), mongoIdParam(), validate, updateComplaintStatus);

export default router;

