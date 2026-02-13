import express from 'express';
import {
    getAllRooms,
    getRoomById,
    createRoom,
    updateRoom,
    deleteRoom,
    getOwnerRooms,
} from '../controllers/roomController';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/roleCheck';

const router = express.Router();

// Public routes
router.get('/', getAllRooms);
router.get('/:id', getRoomById);

// Owner routes
router.post('/', authenticate, authorize('owner'), createRoom);
router.put('/:id', authenticate, authorize('owner'), updateRoom);
router.delete('/:id', authenticate, authorize('owner'), deleteRoom);
router.get('/owner/my-rooms', authenticate, authorize('owner'), getOwnerRooms);

export default router;
