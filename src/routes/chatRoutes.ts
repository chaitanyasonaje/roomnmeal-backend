import express from 'express';
import { sendMessage, getMessages, saveMessage } from '../controllers/chatController';
import { authenticate } from '../middleware/auth';
import { validate, sendMessageRules, sendP2PRules, mongoIdParam } from '../middleware/validators';

const router = express.Router();

router.post('/send', authenticate, sendMessageRules, validate, sendMessage); // Bot
router.get('/messages/:userId', authenticate, mongoIdParam('userId'), validate, getMessages); // P2P Get
router.post('/p2p/send', authenticate, sendP2PRules, validate, saveMessage); // P2P Send

export default router;

