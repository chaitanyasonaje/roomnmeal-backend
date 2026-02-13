import express from 'express';
import {
    createBooking,
    getMyBookings,
    getOwnerBookings,
    getBookingById,
    cancelBooking,
    updateBookingStatus,
} from '../controllers/bookingController';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/roleCheck';
import { validate, createBookingRules, updateBookingStatusRules, mongoIdParam } from '../middleware/validators';

const router = express.Router();

// Student routes
router.post('/', authenticate, authorize('student'), createBookingRules, validate, createBooking);
router.get('/my-bookings', authenticate, authorize('student'), getMyBookings);
router.get('/:id', authenticate, mongoIdParam(), validate, getBookingById);
router.put('/:id/cancel', authenticate, authorize('student'), mongoIdParam(), validate, cancelBooking);

// Owner routes
router.get('/owner/bookings', authenticate, authorize('owner'), getOwnerBookings);
router.put('/:id/status', authenticate, authorize('owner'), updateBookingStatusRules, validate, updateBookingStatus);

export default router;

