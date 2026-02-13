import express from 'express';
import { createComplaint, getMyComplaints, getAllComplaints, updateComplaintStatus } from '../controllers/complaintController';
import { authenticate, authorize } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = express.Router();

// Student routes
router.post('/', authenticate, upload.single('image'), createComplaint);
router.get('/my', authenticate, getMyComplaints);

// Admin routes
router.get('/all', authenticate, authorize('admin'), getAllComplaints);
router.put('/:id', authenticate, authorize('admin'), updateComplaintStatus);

export default router;
