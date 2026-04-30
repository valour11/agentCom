import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';

import whatsappRoutes from './routes/whatsapp.routes.js';
import testRoutes from './routes/test.routes.js';
import authRoutes from './routes/auth.routes.js';
import adminRoutes from './routes/admin.routes.js';

dotenv.config();

// Connect to Database
connectDB();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*', // In production, restrict this to your frontend URL
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api', whatsappRoutes);
app.use('/api', testRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

// Socket.io Connection
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join_conversation', (conversationId) => {
    socket.join(conversationId);
    console.log(`Socket ${socket.id} joined conversation ${conversationId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Middleware to inject io into requests if needed
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Basic Route
app.get('/', (req, res) => {
  res.send('WhatsApp CRM Backend is running!');
});

// Start Server
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export { io };
