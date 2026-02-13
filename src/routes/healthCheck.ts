import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
    const dbState = mongoose.connection.readyState;
    const dbStatus: Record<number, string> = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting',
    };

    const healthy = dbState === 1;

    res.status(healthy ? 200 : 503).json({
        status: healthy ? 'ok' : 'degraded',
        uptime: Math.floor(process.uptime()),
        database: dbStatus[dbState] || 'unknown',
        memory: {
            rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
            heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        },
        timestamp: new Date().toISOString(),
    });
});

export default router;
