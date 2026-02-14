import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';

export interface AuthRequest extends Request {
    user?: IUser;
}

export const authenticate = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            if (!process.env.JWT_SECRET) {
                throw new Error('JWT_SECRET is not defined in environment variables');
            }
            const decoded: any = jwt.verify(
                token,
                process.env.JWT_SECRET
            );

            // Get user from the token
            req.user = await User.findById(decoded.id).select('-password') as IUser;

            if (!req.user) {
                res.status(401).json({ success: false, message: 'Not authorized, user not found' });
                return;
            }

            // In production, require account verification
            if (process.env.NODE_ENV === 'production' && !req.user.isVerified) {
                res.status(401).json({ success: false, message: 'Not authorized, account not verified' });
                return;
            }

            return next();
        } catch (error) {
            console.error('Auth middleware error:', error);
            res.status(401).json({ success: false, message: 'Not authorized, token failed' });
            return;
        }
    }

    if (!token) {
        res.status(401).json({ success: false, message: 'Not authorized, no token' });
        return;
    }
};

export const authorize = (...roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user || !roles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                message: `User role ${req.user?.role} is not authorized to access this route`,
            });
            return;
        }
        next();
    };
};

