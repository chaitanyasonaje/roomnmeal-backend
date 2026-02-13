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

const router = express.Router();

// Student routes
router.post('/', authenticate, authorize('student'), createBooking);
router.get('/my-bookings', authenticate, authorize('student'), getMyBookings);
router.get('/:id', authenticate, getBookingById);
router.put('/:id/cancel', authenticate, authorize('student'), cancelBooking);

// Owner routes
router.get('/owner/bookings', authenticate, authorize('owner'), getOwnerBookings);
router.put('/:id/status', authenticate, authorize('owner'), updateBookingStatus);

export default router;
