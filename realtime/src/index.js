require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const { createClient } = require('redis');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || '*',
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

const PORT = process.env.PORT || 4001;

// Redis clients for pub/sub
const redis = createClient({ url: process.env.REDIS_URL });
const subscriber = createClient({ url: process.env.REDIS_URL });
const publisher = createClient({ url: process.env.REDIS_URL });

// Connect to Redis
Promise.all([
  redis.connect(),
  subscriber.connect(),
  publisher.connect()
]).then(() => {
  console.log('Redis clients connected');
}).catch((err) => {
  console.error('Redis connection error:', err);
});

// Subscribe to Redis channels
const channels = ['messages', 'notifications', 'presence', 'updates'];
channels.forEach(channel => {
  subscriber.subscribe(channel, (message) => {
    try {
      const data = JSON.parse(message);
      io.emit(channel, data);
      console.log(`[${channel}] Broadcasted:`, data);
    } catch (error) {
      console.error(`Error parsing message from ${channel}:`, error);
    }
  });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Join a room
  socket.on('join', (room) => {
    socket.join(room);
    console.log(`${socket.id} joined room: ${room}`);

    // Publish presence update
    publisher.publish('presence', JSON.stringify({
      userId: socket.id,
      room,
      action: 'join',
      timestamp: new Date().toISOString()
    }));
  });

  // Leave a room
  socket.on('leave', (room) => {
    socket.leave(room);
    console.log(`${socket.id} left room: ${room}`);

    publisher.publish('presence', JSON.stringify({
      userId: socket.id,
      room,
      action: 'leave',
      timestamp: new Date().toISOString()
    }));
  });

  // Send message
  socket.on('message', (data) => {
    console.log(`Message from ${socket.id}:`, data);

    // Publish to Redis for multi-server support
    publisher.publish('messages', JSON.stringify({
      userId: socket.id,
      ...data,
      timestamp: new Date().toISOString()
    }));
  });

  // Send notification
  socket.on('notification', (data) => {
    publisher.publish('notifications', JSON.stringify({
      userId: socket.id,
      ...data,
      timestamp: new Date().toISOString()
    }));
  });

  // Custom event handler
  socket.on('custom', (event, data) => {
    console.log(`Custom event '${event}' from ${socket.id}:`, data);

    // Emit to specific room if specified
    if (data.room) {
      io.to(data.room).emit(event, data);
    } else {
      io.emit(event, data);
    }
  });

  // Disconnect
  socket.on('disconnect', (reason) => {
    console.log(`User disconnected: ${socket.id}, reason: ${reason}`);

    publisher.publish('presence', JSON.stringify({
      userId: socket.id,
      action: 'disconnect',
      reason,
      timestamp: new Date().toISOString()
    }));
  });

  // Error handling
  socket.on('error', (error) => {
    console.error(`Socket error for ${socket.id}:`, error);
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    connections: io.engine.clientsCount,
    timestamp: new Date().toISOString()
  });
});

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`EnvoyLabs Real-time server running on port ${PORT}`);
  console.log(`Active connections: ${io.engine.clientsCount}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing server');
  io.close();
  await redis.quit();
  await subscriber.quit();
  await publisher.quit();
  process.exit(0);
});
