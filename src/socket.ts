import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import logger from './config/logger';

let io: SocketIOServer;

export const initSocket = (httpServer: HttpServer) => {
    io = new SocketIOServer(httpServer, {
        cors: {
            origin: '*', // Allow all for MVP App
            methods: ['GET', 'POST']
        }
    });

    io.on('connection', (socket: Socket) => {
        logger.info(`Socket connected: ${socket.id}`);

        // User joins their own room for private messaging
        socket.on('join_room', (userId: string) => {
            socket.join(userId);
            logger.info(`Socket ${socket.id} joined room ${userId}`);
        });

        socket.on('disconnect', () => {
            logger.info(`Socket disconnected: ${socket.id}`);
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};
