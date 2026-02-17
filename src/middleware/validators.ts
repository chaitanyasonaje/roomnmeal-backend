import { body, param, query, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

// ---------- Shared: run validators and return 400 on failure ----------
export const validate = (req: Request, res: Response, next: NextFunction): void => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array().map(e => ({ field: (e as any).path, message: e.msg })),
        });
        return;
    }
    next();
};

// ========================  AUTH  ========================
export const registerRules = [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('phone').matches(/^[0-9]{10}$/).withMessage('Valid 10-digit phone is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').optional().isIn(['student', 'owner']).withMessage('Role must be student or owner'),
];

export const loginRules = [
    body('emailOrPhone').trim().notEmpty().withMessage('Email or phone is required'),
    body('password').notEmpty().withMessage('Password is required'),
];

export const changePasswordRules = [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
];

export const resetPasswordRules = [
    body('emailOrPhone').trim().notEmpty().withMessage('Email or phone is required'),
    body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
    body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

export const sendOtpRules = [
    body('emailOrPhone').trim().notEmpty().withMessage('Email or phone is required'),
];

export const sendRegisterOtpRules = [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('phone').matches(/^[0-9]{10}$/).withMessage('Valid 10-digit phone is required'),
];

export const verifyOtpRules = [
    body('emailOrPhone').trim().notEmpty().withMessage('Email or phone is required'),
    body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
];

// ========================  BOOKING  ========================
export const createBookingRules = [
    body('bookingType').isIn(['room', 'mess']).withMessage('Booking type must be room or mess'),
    body('roomId').optional().isMongoId().withMessage('Valid room ID is required'),
    body('messPlanId').optional().isMongoId().withMessage('Valid mess plan ID is required'),
    body('startDate').isISO8601().withMessage('Valid start date is required'),
];

export const updateBookingStatusRules = [
    param('id').isMongoId().withMessage('Valid booking ID is required'),
    body('status').isIn(['confirmed', 'cancelled']).withMessage('Status must be confirmed or cancelled'),
];

// ========================  PAYMENT  ========================
export const createPaymentRules = [
    body('bookingId').notEmpty().isMongoId().withMessage('Valid booking ID is required'),
];

export const verifyPaymentRules = [
    body('razorpayOrderId').notEmpty().withMessage('Razorpay order ID is required'),
    body('razorpayPaymentId').notEmpty().withMessage('Razorpay payment ID is required'),
    body('razorpaySignature').notEmpty().withMessage('Razorpay signature is required'),
];

// ========================  REVIEW  ========================
export const createReviewRules = [
    body('targetType').isIn(['room', 'mess', 'service']).withMessage('Target type must be room, mess, or service'),
    body('targetId').isMongoId().withMessage('Valid target ID is required'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be 1-5'),
    body('comment').optional().trim().isLength({ max: 500 }).withMessage('Comment too long (max 500 chars)'),
];

// ========================  SERVICE  ========================
export const createServiceRules = [
    body('name').trim().notEmpty().withMessage('Service name is required'),
    body('category').trim().notEmpty().withMessage('Category is required'),
    body('price').isNumeric().withMessage('Price must be a number'),
];

export const createServiceRequestRules = [
    body('serviceId').isMongoId().withMessage('Valid service ID is required'),
];

// ========================  EXPENSE  ========================
export const addExpenseRules = [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('amount').isFloat({ gt: 0 }).withMessage('Amount must be positive'),
    body('category').trim().notEmpty().withMessage('Category is required'),
];

// ========================  CHAT  ========================
export const sendMessageRules = [
    body('message').trim().notEmpty().isLength({ max: 2000 }).withMessage('Message is required (max 2000 chars)'),
];

export const sendP2PRules = [
    body('receiverId').isMongoId().withMessage('Valid receiver ID is required'),
    body('text').trim().notEmpty().isLength({ max: 2000 }).withMessage('Message is required (max 2000 chars)'),
];

// ========================  COMPLAINT  ========================
export const createComplaintRules = [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').trim().notEmpty().isLength({ max: 1000 }).withMessage('Description is required (max 1000 chars)'),
];

// ========================  MONGO ID PARAM  ========================
export const mongoIdParam = (paramName: string = 'id') => [
    param(paramName).isMongoId().withMessage(`Valid ${paramName} is required`),
];
