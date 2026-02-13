import express from 'express';
import {
    register,
    login,
    getProfile,
    updateProfile,
    changePassword,
    sendRegisterOtp,
    sendOtp,
    verifyOtpLogin,
    resetPassword
} from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, upload.any(), updateProfile);
router.put('/change-password', authenticate, changePassword);

// OTP Routes (Optional usages)
router.post('/send-register-otp', sendRegisterOtp);
router.post('/send-otp', sendOtp);
router.post('/verify-otp-login', verifyOtpLogin);
router.post('/reset-password', resetPassword);

export default router;
