const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const logger = require('./lib/logger');
const { errorHandler, notFound } = require('./middleware/error');

// Routes
const authRoutes = require('./routes/auth');
const orgRoutes = require('./routes/organisations');
const taskRoutes = require('./routes/tasks');
const billingRoutes = require('./routes/billing');
const webhookRoutes = require('./routes/webhooks');
const memberRoutes = require('./routes/members');
const featureFlagRoutes = require('./routes/featureFlags');
const dashboardRoutes = require('./routes/dashboard');

const app = express();

// ─── TRUST PROXY (for ALB) ──────────────────────────────────────
app.set('trust proxy', true);

// ── Security headers ──────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
      fontSrc: ["'self'", "https:", "data:"],
      formAction: ["'self'"],
      frameAncestors: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  }
}));

// ── CORS ──────────────────────────────────────────────────────────
const corsOptions = {
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3001',
    'https://staging.srzoh.com.ng',
    'http://localhost:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// ── Rate Limiting ────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  trustProxy: true,
  validate: {
    trustProxy: false // ✅ FIX: Disable validation to avoid warning
  }
});

// Apply rate limiting to all API routes
app.use('/api', limiter);

// ── Request Logging ──────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// ── Body Parsers ──────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ── Health Check ──────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'opsshield-api',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// ── Routes ────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/organisations', orgRoutes);
app.use('/api/feature-flags', featureFlagRoutes);
app.use('/api/dashboard', dashboardRoutes);

// ── 404 Handler ──────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    error: `Route ${req.method} ${req.path} not found`
  });
});

// ── Global Error Handler ─────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Error:', err);

  const status = err.status || 500;
  const message = err.message || 'An unexpected error occurred';

  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

module.exports = app;
