import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import cors from 'cors';

import connectDB from './config/db';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import messageRoutes from './routes/messageRoutes';

dotenv.config();

const app = express();
const server = http.createServer(app);

// ✅ REST API CORS
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());

// ✅ API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);

// 🔌 Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

// 🗺️ Track online users
const onlineUsers = new Map<string, string>();

io.on('connection', (socket) => {
  console.log('🟢 New socket connected:', socket.id);

  // ✅ Step 1: Register user to socket map
  socket.on('add-user', (userId: string) => {
    onlineUsers.set(userId, socket.id);
    console.log(`✅ add-user: User ${userId} is now online with socket ${socket.id}`);
    console.log('🌍 Current onlineUsers map:', Object.fromEntries(onlineUsers));
  });

  // ✅ Step 2: Handle send-message
  socket.on('send-message', ({ to, message }) => {
    console.log(`📤 Message from ${socket.id} to user ${to}`);
    console.log(`📝 Message content:`, message);

    const receiverSocketId = onlineUsers.get(to);
    if (receiverSocketId) {
      console.log(`📡 Emitting msg-receive to socket ${receiverSocketId}`);
      io.to(receiverSocketId).emit('msg-receive', message);
    } else {
      console.warn(`⚠️ User ${to} is offline. No socket found.`);
    }
  });

  // ✅ Step 3: Handle disconnect
  socket.on('disconnect', () => {
    console.log('🔴 Socket disconnected:', socket.id);

    // 🧹 Clean up: remove from onlineUsers
    for (const [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        console.log(`🧹 Removed user ${userId} from online users.`);
        break;
      }
    }
  });
});

// 🚀 Start server after DB is connected
connectDB().then(() => {
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`🚀 Server listening on port ${PORT}`);
  });
});
