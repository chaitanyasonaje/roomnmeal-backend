import { Request, Response, NextFunction } from 'express';
import admin from '../config/firebase';
import User from '../models/User';

// Extend Express Request type to include user
declare global {
    namespace Express {
        interface Request {
            firebaseUser?: admin.auth.DecodedIdToken;
            user?: any; // Mongoose document
        }
    }
}

// 1. Firebase Authentication Middleware
export const firebaseAuth = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: 'Unauthorized - No Token Provided' });
        }

        const token = authHeader.split('Bearer ')[1];

        try {
            const decodedToken = await admin.auth().verifyIdToken(token);
            req.firebaseUser = decodedToken;
            next();
        } catch (error) {
            console.error('Token Verification Error:', error);
            return res.status(401).json({ success: false, message: 'Unauthorized - Invalid Token' });
        }

    } catch (error) {
        console.error('Auth Middleware Error:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

// 2. User Sync Middleware
// This ensures the Firebase user exists in MongoDB and attaches it to req.user
export const syncUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.firebaseUser) {
            return res.status(401).json({ success: false, message: 'Unauthorized - No Firebase Identity' });
        }

        const { uid, email, name, picture } = req.firebaseUser;

        // Try to find user in MongoDB by firebaseUid (we need to update schema to store this)
        // Or temporarily usage clerkId field or creating a new firebaseUid field
        // Let's use a generic 'authId' or reuse 'clerkId' for now, but ideally we rename it.
        // For migration speed, I will use 'clerkId' field to store 'firebaseUid' for now, 
        // OR I can add a new field 'firebaseUid' to the User model. 
        // Adding a new field is cleaner.

        let user = await User.findOne({
            $or: [{ firebaseUid: uid }, { email: email }]
        });

        if (user) {
            // Update firebaseUid if verified email matches but no uid yet (migration scenario)
            if (!user.firebaseUid) {
                user.firebaseUid = uid;
                await user.save();
            }
            req.user = user;
        } else {
            // Create new user if not found (Optional: depending on valid registration flow)
            // For now, we will just attach null, or typically we might auto-create for students.
            // But usually registration handles creation. 
            // We'll follow the pattern often utilized: if not found, we don't attach.
            // The /register endpoint will handle creation.
        }

        next();
    } catch (error) {
        console.error('User Sync Error:', error);
        res.status(500).json({ success: false, message: 'Authentication Sync Failed' });
    }
};

// 3. User Requirement Middleware
export const requireUser = (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
        return res.status(404).json({
            success: false,
            message: 'User profile not found. Please complete registration.'
        });
    }
    next();
};
