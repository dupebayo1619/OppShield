// src/app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const organisationRoutes = require('./routes/organisations');
const featureFlagRoutes = require('./routes/featureFlags');
const dashboardRoutes = require('./routes/dashboard');
const dashboardPublicRoutes = require('./routes/dashboard-public');

const app = express();
app.set("trust proxy", true);
const PORT = process.env.PORT || 3000;

// ─── SECURITY HEADERS — MUST BE ABSOLUTELY FIRST ──────────────
app.use((req, res, next) => {
  console.log('🔒 Security middleware running for:', req.url);

  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Force HTTPS (Strict Transport Security)
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

  // Disable caching for all API responses
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  // Control referrer information
  res.setHeader('Referrer-Policy', 'no-referrer');

  // Prevent DNS prefetching
  res.setHeader('X-DNS-Prefetch-Control', 'off');

  // Prevent downloading of content
  res.setHeader('X-Download-Options', 'noopen');

  // Cross-Origin policies
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');

  // Permissions Policy
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=(), payment=()');

  next();
});

// ─── Helmet Middleware (adds additional security headers) ──────
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
      upgradeInsecureRequests: [],
    },
  },
  crossOriginOpenerPolicy: { policy: "same-origin" },
  crossOriginResourcePolicy: { policy: "same-origin" },
  referrerPolicy: { policy: "no-referrer" },
}));

// ─── CORS Configuration ─────────────────────────────────────────
// Define allowed origins - COMPLETE LIST WITH ALL DOMAINS
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://staging.srzoh.com.ng',
  'https://opsshield-frontend.vercel.app',
  'https://opsshield-frontend-1otq65vty-dupebayo1619s-projects.vercel.app',
  'https://opsshield.srzoh.com.ng',
  'https://opsshield-sentinels.expadox.com'
];

// Also allow origins from environment variable
if (process.env.FRONTEND_URL) {
  const envOrigins = process.env.FRONTEND_URL.split(',').map(url => url.trim());
  envOrigins.forEach(url => {
    if (!allowedOrigins.includes(url)) {
      allowedOrigins.push(url);
    }
  });
}

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }

    // Check if the origin is allowed
    if (allowedOrigins.indexOf(origin) !== -1) {
      console.log('✅ CORS allowed origin:', origin);
      callback(null, true);
    } else {
      console.log('❌ CORS blocked origin:', origin);
      console.log('✅ Allowed origins:', allowedOrigins);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Length', 'X-Request-Id'],
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options('*', cors(corsOptions));

// ─── Rate Limiting Middleware ──────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all API routes
// app.use('/api', limiter);

// ─── Request Logging ────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// ─── Body Parsers ──────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Health Check Endpoint ─────────────────────────────────────
app.get('/health', (req, res) => {
  // Add headers directly here (bypass middleware)
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

// ─── Routes ─────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/organisations', organisationRoutes);
app.use('/api/feature-flags', featureFlagRoutes);
app.use('/api/dashboard/public', dashboardPublicRoutes);  // ✅ PUBLIC ROUTE - MOUNTED FIRST
app.use('/api/dashboard', dashboardRoutes);

// ─── 404 Handler ────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    error: `Route ${req.method} ${req.path} not found`
  });
});

// ─── Global Error Handler ──────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Error:', err);

  const status = err.status || 500;
  const message = err.message || 'An unexpected error occurred';

  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ─── Start Server ──────────────────────────────────────────────
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 OpsShield running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
    console.log(`📍 Health: http://localhost:${PORT}/health`);
    console.log(`📍 API: http://localhost:${PORT}/api`);
    console.log(`✅ CORS allowed origins:`, allowedOrigins);
  });
}

// ─── Export for Testing ────────────────────────────────────────
module.exports = app;
