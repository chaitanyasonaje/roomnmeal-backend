import express from 'express';
import { sendMessage, getMessages, saveMessage, getConversations, markMessagesAsRead, getAdminUser } from '../controllers/chatController';
import { authenticate } from '../middleware/auth';
import { validate, sendMessageRules, sendP2PRules, mongoIdParam } from '../middleware/validators';

const router = express.Router();

router.post('/send', authenticate, sendMessageRules, validate, sendMessage); // Bot
router.get('/conversations', authenticate, getConversations); // Get all conversations
router.get('/admin', authenticate, getAdminUser); // Get System Admin user
router.get('/messages/:userId', authenticate, mongoIdParam('userId'), validate, getMessages); // P2P Get
router.post('/p2p/send', authenticate, sendP2PRules, validate, saveMessage); // P2P Send
router.post('/mark-read', authenticate, markMessagesAsRead); // Mark as read

export default router;

