import express from 'express';
import { getMyNotifications, markAsRead, markAllAsRead, sendTestNotification } from '../controllers/notificationController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.get('/', authenticate, getMyNotifications);
router.put('/:id/read', authenticate, markAsRead);
router.put('/read-all', authenticate, markAllAsRead);

// Dev route to trigger a notification easily
router.post('/send-test', authenticate, sendTestNotification);

export default router;
