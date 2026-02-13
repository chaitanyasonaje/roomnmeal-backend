import express, { Application, Request, Response } from 'express';
import dotenv from 'dotenv';
// Load environment variables immediately
dotenv.config();

import cors from 'cors';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
const xss = require('xss-clean');
import rateLimit from 'express-rate-limit';
import { connectDatabase } from './config/database';

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

// Load environment variables (Moved to top)
// dotenv.config();

// Initialize Express app
const app: Application = express();

import path from 'path';

// ...

// Middleware
// Set security headers
app.use(helmet());

// Prevent XSS attacks
app.use(xss());

// Sanitize data
app.use(mongoSanitize());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
});

// Apply rate limiting to all requests
app.use(limiter);

app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
// Serve static files (after security middleware, but before routes)
// Note: helmet might block some static content if CSP is too strict, but defaults are usually fine for APIs
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Simple request logger
app.use((req: Request, res: Response, next: any) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    if (req.method === 'POST') {
        console.log('Body:', JSON.stringify(req.body, null, 2));
    }
    next();
});

// Health check route
app.get('/', (req: Request, res: Response) => {
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
app.use((req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
    });
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: any) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
    });
});

// Connect to database and start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await connectDatabase();

        app.listen(PORT, () => {
            console.log(`🚀 Server is running on port ${PORT}`);
            console.log(`📍 http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();

export default app;
