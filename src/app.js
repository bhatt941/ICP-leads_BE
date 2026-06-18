const cors = require('cors');
const express = require('express');
const http = require('http');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { Server } = require('socket.io');
const config = require('./config/env');
const errorHandler = require('./middlewares/errorHandler');
const notFound = require('./middlewares/notFound');
const routes = require('./routes');
const database = require('./config/database');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: config.server.frontendUrl || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

app.use(helmet());
app.use(cors({
  origin: config.server.frontendUrl || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(config.server.nodeEnv === 'production' ? 'combined' : 'dev'));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 500,
    standardHeaders: true,
    legacyHeaders: false
  })
);

app.get('/health', (_req, res) => {
  res.json(healthPayload());
});

app.use(config.server.apiPrefix, routes);
app.get(`${config.server.apiPrefix}/health`, (_req, res) => {
  res.json(healthPayload());
});
app.use(notFound);
app.use(errorHandler);

app.set('io', io);
app.server = server;
app.io = io;

io.on('connection', (socket) => {
  socket.on('join', ({ userId }) => {
    if (userId) {
      socket.join(`user:${String(userId)}`);
    }
  });

  socket.on('disconnect', () => {
    // no-op
  });
});

module.exports = app;

function healthPayload() {
  return {
    status: 'ok',
    database: config.database.mode === 'memory' ? 'memory' : (database.isConnected() ? 'connected' : 'disconnected'),
    // redis: config.database.mode === 'memory' ? 'mock' : 'connected',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  };
}
