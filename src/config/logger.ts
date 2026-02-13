import winston from 'winston';

const isProduction = process.env.NODE_ENV === 'production';

const logger = winston.createLogger({
    level: isProduction ? 'info' : 'debug',
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        isProduction
            ? winston.format.json()
            : winston.format.combine(
                winston.format.colorize(),
                winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
                    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
                    return `${timestamp} ${level}: ${stack || message}${metaStr}`;
                })
            )
    ),
    defaultMeta: { service: 'roomnmeal-api' },
    transports: [
        new winston.transports.Console(),
    ],
});

export default logger;
