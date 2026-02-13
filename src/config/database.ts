import mongoose from 'mongoose';
import dns from 'dns';
import logger from './logger';

// Force custom DNS to resolve SRV lookup failures
try {
    dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {
    logger.warn('Could not set custom DNS servers');
}

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3000;

export const connectDatabase = async (): Promise<void> => {
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
        logger.error('MONGODB_URI is not defined in .env');
        process.exit(1);
    }

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            await mongoose.connect(mongoUri, {
                family: 4,
                serverSelectionTimeoutMS: 10_000,
                socketTimeoutMS: 45_000,
                maxPoolSize: 10,
            });
            logger.info('MongoDB Connected');
            return;
        } catch (err) {
            logger.error(`MongoDB Connection Attempt ${attempt}/${MAX_RETRIES} failed`, { error: err });
            if (attempt === MAX_RETRIES) {
                if (process.env.NODE_ENV === 'production') {
                    process.exit(1);
                }
                logger.error('All connection attempts exhausted. Continuing in dev mode...');
                return;
            }
            const delay = RETRY_DELAY_MS * attempt;
            logger.info(`Retrying in ${delay / 1000}s...`);
            await new Promise(r => setTimeout(r, delay));
        }
    }
};

mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB Disconnected');
});

mongoose.connection.on('error', (err) => {
    logger.error('MongoDB Error', { error: err });
});

