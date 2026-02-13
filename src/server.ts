import express, { Application, Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
// Load environment variables immediately
dotenv.config();

import cors from 'cors';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
const xss = require('xss-clean');
import rateLimit from 'express-rate-limit';
import path from 'path';
import { connectDatabase } from './config/database';
import logger from './config/logger';

// Import routes
import authRoutes from './routes/authRoutes';
import roomRoutes from './routes/roomRoutes';
import messRoutes from './routes/messRoutes';
import bookingRoutes from './routes/bookingRoutes';
import paymentRoutes from './routes/paymentRoutes';
import adminRoutes from './routes/adminRoutes';
import serviceRoutes from './routes/serviceRoutes';
import complaintRoutes from './routes/complaintRoutes';
import notificationRoutes from './routes/notificationRoutes';
import roommateRoutes from './routes/roommateRoutes';
import expenseRoutes from './routes/expenseRoutes';
import chatRoutes from './routes/chatRoutes';
import uploadRoutes from './routes/uploadRoutes';
import reviewRoutes from './routes/reviewRoutes';
import healthRoutes from './routes/healthCheck';

// --- Environment validation ---
const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production';

if (isProduction && (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'dev_secret_key_12345')) {
    logger.error('FATAL: JWT_SECRET must be set to a strong value in production');
    process.exit(1);
}

// Initialize Express app
const app: Application = express();

// --- Middleware ---

// Set security headers
app.use(helmet());

// Prevent XSS attacks
app.use(xss());

// Sanitize data
app.use(mongoSanitize());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isProduction ? 100 : 1000, // More permissive in dev
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
});
app.use(limiter);

// CORS — restrict origins in production
const corsOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
    : true; // allow all in dev when CORS_ORIGIN is unset

app.use(cors({
    origin: corsOrigins,
    credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Request logger — NEVER log request bodies (they contain passwords/tokens)
app.use((req: Request, _res: Response, next: NextFunction) => {
    if (!isProduction) {
        logger.info(`${req.method} ${req.url}`);
    }
    next();
});

// --- Routes ---

// Health check
app.use('/health', healthRoutes);

app.get('/', (_req: Request, res: Response) => {
    res.status(200).json({
        success: true,
        message: 'RoomNMeal API is running',
        version: '1.0.0',
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/mess', messRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/roommates', roommateRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/reviews', reviewRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
    });
});

// Error handling middleware — never leak internals in production
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    logger.error('Unhandled error', { error: err.message, stack: err.stack });

    const statusCode = err.status || 500;
    const message = isProduction && statusCode === 500
        ? 'Internal server error'
        : (err.message || 'Internal server error');

    res.status(statusCode).json({
        success: false,
        message,
    });
});

// --- Start server ---
const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await connectDatabase();

        const server = app.listen(PORT, () => {
            logger.info(`Server running in ${NODE_ENV} mode on port ${PORT}`);
        });

        // Graceful shutdown
        const shutdown = (signal: string) => {
            logger.info(`${signal} received. Shutting down gracefully...`);
            server.close(() => {
                logger.info('HTTP server closed');
                process.exit(0);
            });
            // Force exit after 10s if graceful shutdown fails
            setTimeout(() => {
                logger.error('Forced shutdown after timeout');
                process.exit(1);
            }, 10_000);
        };

        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));
    } catch (error) {
        logger.error('Failed to start server', { error });
        process.exit(1);
    }
};

startServer();

export default app;
