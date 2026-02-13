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
import {
    validate,
    registerRules,
    loginRules,
    changePasswordRules,
    resetPasswordRules,
    sendOtpRules,
    verifyOtpRules,
} from '../middleware/validators';

const router = express.Router();

router.post('/register', registerRules, validate, register);
router.post('/login', loginRules, validate, login);
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, upload.any(), updateProfile);
router.put('/change-password', authenticate, changePasswordRules, validate, changePassword);

// OTP Routes
router.post('/send-register-otp', sendOtpRules, validate, sendRegisterOtp);
router.post('/send-otp', sendOtpRules, validate, sendOtp);
router.post('/verify-otp-login', verifyOtpRules, validate, verifyOtpLogin);
router.post('/reset-password', resetPasswordRules, validate, resetPassword);

export default router;

