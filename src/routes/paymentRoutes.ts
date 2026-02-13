import express from 'express';
import {
    createPaymentOrder,
    verifyPayment,
    getPaymentDetails,
    handleWebhook,
} from '../controllers/paymentController';
import { authenticate } from '../middleware/auth';
import { validate, createPaymentRules, verifyPaymentRules, mongoIdParam } from '../middleware/validators';

const router = express.Router();

router.post('/create-order', authenticate, createPaymentRules, validate, createPaymentOrder);
router.post('/verify', authenticate, verifyPaymentRules, validate, verifyPayment);
router.post('/webhook', handleWebhook); // No auth middleware for webhooks
router.get('/:id', authenticate, mongoIdParam(), validate, getPaymentDetails);

export default router;

