import { Request, Response } from 'express';
import crypto from 'crypto';
import User from '../models/User';
import OTP from '../models/OTP';
import { AuthRequest } from '../middleware/auth';
import { sendEmail } from '../services/emailService';

// ==================== OTP System ====================

const RATELIMIT_WINDOW = 60 * 1000; // 1 minute

const generateOtp = (): string => {
    return crypto.randomInt(100000, 999999).toString();
};

export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, email, phone, password, role } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ email }, { phone }],
        });

        if (existingUser) {
            res.status(400).json({
                success: false,
                message: 'User with this email or phone already exists',
            });
            return;
        }

        // Create new user
        // SECURITY FIX: Prevent privilege escalation. 
        // Only allow 'student' and 'owner' roles during public registration.
        // Force 'admin' requests to 'student'.
        const safeRole = (role === 'owner') ? 'owner' : 'student';

        const user = await User.create({
            name,
            email,
            phone,
            password,
            role: safeRole,
        });

        // Generate token
        const token = user.generateAuthToken();

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    role: user.role,
                },
                token,
            },
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Registration failed',
        });
    }
};

export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { emailOrPhone, password } = req.body;

        // Find user by email or phone
        const user = await User.findOne({
            $or: [{ email: emailOrPhone }, { phone: emailOrPhone }],
        }).select('+password');

        if (!user) {
            res.status(401).json({
                success: false,
                message: 'Invalid credentials',
            });
            return;
        }

        // Check password
        const isPasswordValid = await user.comparePassword(password);

        if (!isPasswordValid) {
            res.status(401).json({
                success: false,
                message: 'Invalid credentials',
            });
            return;
        }

        // Generate token
        const token = user.generateAuthToken();

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    role: user.role,
                },
                token,
            },
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Login failed',
        });
    }
};

export const getProfile = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user._id;
        const user = await User.findById(userId);

        res.status(200).json({
            success: true,
            data: {
                user: {
                    id: user?._id,
                    name: user?.name,
                    email: user?.email,
                    phone: user?.phone,
                    role: user?.role,
                },
            },
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch profile',
        });
    }
};

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user?._id;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Authentication required' });
            return;
        }
        const { idProofType, name, phone, bankDetails } = req.body;
        console.log(`[DEBUG] UpdateProfile attempt for user: ${userId}`, { name, phone, idProofType, hasBankDetails: !!bankDetails });

        let updateData: any = {};
        if (idProofType) updateData.idProofType = idProofType;
        if (name) updateData.name = name;
        if (bankDetails) updateData.bankDetails = bankDetails;
        if (phone) {
            updateData.phone = phone;
            // Check if phone already used by another user to prevent 500 error from Mongo index
            const existingUser = await User.findOne({ phone, _id: { $ne: userId } });
            if (existingUser) {
                console.warn(`[WARN] Phone number already taken: ${phone} by user: ${existingUser._id}`);
                res.status(400).json({
                    success: false,
                    message: 'This phone number is already registered with another account',
                });
                return;
            }
        }

        // Handle file upload (handle both req.file and req.files from upload.any())
        const files = req.file ? [req.file] : (req.files as Express.Multer.File[] || []);

        if (files.length > 0) {
            files.forEach(file => {
                const fileUrl = file.path.replace(/\\/g, "/");
                if (file.fieldname === 'document' || file.fieldname === 'idProof') {
                    updateData.idProofUrl = fileUrl;
                } else if (file.fieldname === 'profilePicture' || file.fieldname === 'avatar') {
                    updateData.profilePicture = fileUrl;
                }
            });
        }

        const user = await User.findByIdAndUpdate(userId, updateData, {
            new: true,
            runValidators: true,
        });

        if (!user) {
            console.error(`[ERROR] User not found during update: ${userId}`);
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                user: {
                    id: user?._id,
                    name: user?.name,
                    email: user?.email,
                    phone: user?.phone,
                    role: user?.role,
                    profilePicture: user?.profilePicture,
                    idProofType: user?.idProofType,
                    idProofUrl: user?.idProofUrl,
                    isVerified: user?.isVerified
                },
            },
        });
    } catch (error: any) {
        console.error('[ERROR] Update Profile Detail:', {
            message: error.message,
            name: error.name,
            code: error.code,
            errors: error.errors ? Object.keys(error.errors) : undefined,
            stack: error.stack
        });

        // Handle Mongoose validation errors specifically as 400
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map((e: any) => e.message);
            res.status(400).json({
                success: false,
                message: messages.join(', '),
                details: process.env.NODE_ENV === 'development' ? error.errors : undefined
            });
            return;
        }

        // Handle Mongo duplicate key errors (code 11000)
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern || {})[0] || 'field';
            res.status(400).json({
                success: false,
                message: `Duplicate value for ${field}. This account may already exist.`,
            });
            return;
        }

        res.status(500).json({
            success: false,
            message: error.message || 'Failed to update profile',
            error: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
};

export const changePassword = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user._id;
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            res.status(400).json({ success: false, message: 'Please provide current and new password' });
            return;
        }

        if (newPassword.length < 6) {
            res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
            return;
        }

        const user = await User.findById(userId).select('+password');
        if (!user) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }

        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            res.status(400).json({ success: false, message: 'Current password is incorrect' });
            return;
        }

        user.password = newPassword;
        await user.save();

        res.status(200).json({ success: true, message: 'Password changed successfully' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message || 'Failed to change password' });
    }
};

// Reset password using OTP (forgot password flow)
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
    try {
        const { emailOrPhone, otp, newPassword } = req.body;

        if (!emailOrPhone || !otp || !newPassword) {
            res.status(400).json({ success: false, message: 'Please provide email/phone, OTP, and new password' });
            return;
        }

        if (newPassword.length < 6) {
            res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
            return;
        }

        // Verify OTP using Database
        const otpRecord = await OTP.findOne({ identifier: emailOrPhone });

        if (!otpRecord) {
            res.status(400).json({ success: false, message: 'OTP not found or expired. Please request a new one.' });
            return;
        }

        if (otpRecord.otp !== otp) {
            res.status(400).json({ success: false, message: 'Invalid OTP' });
            return;
        }

        // Check expiry (though Mongo TTL handles this, extra check is good)
        if (Date.now() > otpRecord.expiresAt.getTime()) {
            await OTP.deleteOne({ _id: otpRecord._id });
            res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
            return;
        }

        // OTP verified — find user and update password
        await OTP.deleteOne({ _id: otpRecord._id });

        const user = await User.findOne({
            $or: [{ email: emailOrPhone }, { phone: emailOrPhone }],
        }).select('+password');

        if (!user) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }

        user.password = newPassword;
        await user.save();

        res.status(200).json({ success: true, message: 'Password reset successfully. You can now login.' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message || 'Failed to reset password' });
    }
};

// Send OTP for new registration (no existing user required)
export const sendRegisterOtp = async (req: Request, res: Response): Promise<void> => {
    try {
        const { phone, email } = req.body;
        const target = phone || email;

        if (!target) {
            res.status(400).json({ success: false, message: 'Please provide phone number or email' });
            return;
        }

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ email: target }, { phone: target }],
        });

        if (existingUser) {
            res.status(400).json({ success: false, message: 'User with this email or phone already exists' });
            return;
        }

        // Check rate limit by looking for existing OTP created recently
        const existingOtp = await OTP.findOne({ identifier: target });
        if (existingOtp && (Date.now() - existingOtp.createdAt.getTime() < RATELIMIT_WINDOW)) {
            res.status(429).json({ success: false, message: 'Please wait 1 minute before requesting another OTP' });
            return;
        }

        // Delete any existing OTPs for this target
        await OTP.deleteMany({ identifier: target });

        const otp = generateOtp();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

        await OTP.create({
            identifier: target,
            otp,
            expiresAt
        });

        // In production, integrate SMS/Email provider here
        // console.log(`\n📱 Registration OTP for ${target}: ${otp}\n`); // REMOVED FOR PRODUCTION

        if (email) {
            try {
                await sendEmail({
                    email: email,
                    subject: 'Verify Your Email - RoomNMeal',
                    message: `Your verification OTP is: ${otp}`,
                    html: `<p>Your verification OTP is: <b>${otp}</b></p>`
                });
            } catch (emailError) {
                console.error('Failed to send email:', emailError);
                // Fail gracefully or strict? Strict for registration verification.
                res.status(500).json({ success: false, message: 'Failed to send verification email' });
                return;
            }
        }

        res.status(200).json({
            success: true,
            message: 'OTP sent successfully',
            data: {
                // Remove devOtp in production!
                // devOtp: process.env.NODE_ENV === 'production' ? undefined : otp, 
            },
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message || 'Failed to send OTP' });
    }
};

export const sendOtp = async (req: Request, res: Response): Promise<void> => {
    try {
        const { emailOrPhone } = req.body;

        if (!emailOrPhone) {
            res.status(400).json({ success: false, message: 'Please provide email or phone number' });
            return;
        }

        // Check if user exists
        const user = await User.findOne({
            $or: [{ email: emailOrPhone }, { phone: emailOrPhone }],
        });

        if (!user) {
            res.status(404).json({ success: false, message: 'No account found with this email or phone' });
            return;
        }

        // Check rate limit
        const existingOtp = await OTP.findOne({ identifier: emailOrPhone });
        if (existingOtp && (Date.now() - existingOtp.createdAt.getTime() < RATELIMIT_WINDOW)) {
            res.status(429).json({ success: false, message: 'Please wait 1 minute before requesting another OTP' });
            return;
        }

        // Delete previous OTPs
        await OTP.deleteMany({ identifier: emailOrPhone });

        // Generate OTP
        const otp = generateOtp();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

        // Store OTP
        await OTP.create({
            identifier: emailOrPhone,
            otp,
            expiresAt
        });

        // In production, send via SMS/Email service
        // console.log(`\n🔐 OTP for ${emailOrPhone}: ${otp}\n`); // REMOVED FOR PRODUCTION

        try {
            await sendEmail({
                email: emailOrPhone,
                subject: 'Your Login OTP - RoomNMeal',
                message: `Your OTP for login is: ${otp}. It is valid for 5 minutes.`,
                html: `<p>Your OTP for login is: <b>${otp}</b>. It is valid for 5 minutes.</p>`
            });
        } catch (emailError) {
            console.error('Failed to send email:', emailError);
            res.status(500).json({ success: false, message: 'Failed to send OTP via email' });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'OTP sent successfully',
            data: {},
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message || 'Failed to send OTP' });
    }
};

export const verifyOtpLogin = async (req: Request, res: Response): Promise<void> => {
    try {
        const { emailOrPhone, otp } = req.body;

        if (!emailOrPhone || !otp) {
            res.status(400).json({ success: false, message: 'Please provide email/phone and OTP' });
            return;
        }

        // Check stored OTP in DB
        const otpRecord = await OTP.findOne({ identifier: emailOrPhone });

        if (!otpRecord) {
            res.status(400).json({ success: false, message: 'OTP not found or expired. Please request a new one.' });
            return;
        }

        if (Date.now() > otpRecord.expiresAt.getTime()) {
            await OTP.deleteOne({ _id: otpRecord._id });
            res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
            return;
        }

        if (otpRecord.otp !== otp) {
            res.status(400).json({ success: false, message: 'Invalid OTP' });
            return;
        }

        // OTP verified — delete it
        await OTP.deleteOne({ _id: otpRecord._id });

        const user = await User.findOne({
            $or: [{ email: emailOrPhone }, { phone: emailOrPhone }],
        });

        if (!user) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }

        const token = user.generateAuthToken();

        res.status(200).json({
            success: true,
            message: 'OTP verified successfully',
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    role: user.role,
                },
                token,
            },
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message || 'OTP verification failed' });
    }
};

// Delete account
export const deleteProfile = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user._id;

        const user = await User.findByIdAndDelete(userId);

        if (!user) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'Account deleted successfully'
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to delete account'
        });
    }
};

export const updatePushToken = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?._id;
        const { pushToken } = req.body;

        if (!pushToken) {
            res.status(400).json({ success: false, message: 'Push token is required' });
            return;
        }

        await User.findByIdAndUpdate(userId, { pushToken });

        res.status(200).json({ success: true, message: 'Push token updated' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message || 'Failed to update push token' });
    }
};
