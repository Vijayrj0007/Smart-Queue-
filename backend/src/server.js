/**
 * Smart Queue Management System — Backend Server
 * Express + Socket.io + PostgreSQL
 * 
 * Main entry point for the API server
 */
require('dotenv').config();

// Ensure database schema is up-to-date before serving any requests.
// This prevents auth/login failures when a migration hasn't been applied yet.
require('./db/migrate');

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

// Import routes
const authRoutes = require('./routes/auth.routes');
const orgRoutes = require('./routes/org.routes');
const orgQueueRoutes = require('./routes/orgQueue.routes');
const orgTokenRoutes = require('./routes/orgToken.routes');
const locationRoutes = require('./routes/location.routes');
const queueRoutes = require('./routes/queue.routes');
const tokenRoutes = require('./routes/token.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const notificationRoutes = require('./routes/notification.routes');
const adminRoutes = require('./routes/admin.routes');

// Import socket handler
const { initializeSocket } = require('./socket/index');

// Create Express app and HTTP server
const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    // In dev, reflect the requesting origin so LAN IP access works.
    // In production, keep strict origin control.
    origin:
      process.env.NODE_ENV !== 'production'
        ? true
        : (process.env.CORS_ORIGIN || 'http://localhost:3000'),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

// Store io instance on app for use in controllers
app.set('io', io);

// Initialize socket handlers
initializeSocket(io);

// ===== MIDDLEWARE =====

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// CORS
app.use(cors({
  // In dev, reflect the requesting origin so LAN IP access works.
  // In production, keep strict origin control.
  origin:
    process.env.NODE_ENV !== 'production'
      ? true
      : (process.env.CORS_ORIGIN || 'http://localhost:3000'),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Request logging
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    success: false,
    message: 'Too many requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to auth routes
app.use('/api/auth', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many auth attempts, please try again later.' }
}));

// ===== ROUTES =====

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'SmartQueue API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    uptime: process.uptime()
  });
});

// Mount route handlers
app.use('/api/auth', authRoutes);
app.use('/api/org', orgRoutes);
app.use('/api/org/queues', orgQueueRoutes);
app.use('/api/org', orgTokenRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/queues', queueRoutes);
app.use('/api/tokens', tokenRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

// ===== ERROR HANDLING =====

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found.`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Unhandled Error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error.' 
      : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// ===== START SERVER =====
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════╗
║                                                  ║
║   🏥 SmartQueue API Server                       ║
║                                                  ║
║   Port:        ${PORT}                              ║
║   Environment: ${process.env.NODE_ENV || 'development'}                   ║
║   Socket.io:   Enabled                           ║
║                                                  ║
║   API Base:    http://localhost:${PORT}/api          ║
║   Health:      http://localhost:${PORT}/api/health   ║
║                                                  ║
╚══════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});

module.exports = { app, server, io };
