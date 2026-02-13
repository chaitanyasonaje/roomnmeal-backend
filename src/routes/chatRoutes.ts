import express from 'express';
import { sendMessage, getMessages, saveMessage } from '../controllers/chatController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.post('/send', sendMessage); // Bot
router.get('/messages/:userId', authenticate, getMessages); // P2P Get
router.post('/p2p/send', authenticate, saveMessage); // P2P Send

export default router;
