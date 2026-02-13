import express from 'express';
import {
    createPaymentOrder,
    verifyPayment,
    getPaymentDetails,
    handleWebhook,
} from '../controllers/paymentController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.post('/create-order', authenticate, createPaymentOrder);
router.post('/verify', authenticate, verifyPayment);
router.post('/webhook', handleWebhook); // No auth middleware for webhooks
router.get('/:id', authenticate, getPaymentDetails);

export default router;
