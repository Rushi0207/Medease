import { Server } from 'socket.io';
import { authenticateSocket } from '../middleware/socketAuth';

export const setupSocketIO = (io: Server): void => {
  // Authentication middleware for socket connections
  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Join user to their personal room
    const userId = (socket as any).userId;
    if (userId) {
      socket.join(`user_${userId}`);
      console.log(`User ${userId} joined personal room`);
    }

    // Handle chat room joining
    socket.on('join_room', (roomId: string) => {
      socket.join(roomId);
      console.log(`User ${userId} joined room: ${roomId}`);
    });

    // Handle chat room leaving
    socket.on('leave_room', (roomId: string) => {
      socket.leave(roomId);
      console.log(`User ${userId} left room: ${roomId}`);
    });

    // Handle sending messages (will be implemented in chat task)
    socket.on('send_message', (data) => {
      console.log('Message received:', data);
      // Message handling will be implemented in chat functionality
    });

    // Handle typing indicators
    socket.on('typing_start', (roomId: string) => {
      socket.to(roomId).emit('user_typing', { userId, isTyping: true });
    });

    socket.on('typing_stop', (roomId: string) => {
      socket.to(roomId).emit('user_typing', { userId, isTyping: false });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });

  console.log('✅ Socket.IO server configured');
};