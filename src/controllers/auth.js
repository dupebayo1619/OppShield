// src/controllers/auth.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const logger = require('../lib/logger');
const audit = require('../lib/audit');

// ─── Register ──────────────────────────────────────────────────────
async function register(req, res, next) {
  try {
    const { email, password, firstName, lastName, orgName } = req.body;

    // Check if user exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user and organisation in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create organisation
      const organisation = await tx.organisation.create({
        data: {
          name: orgName,
          slug: orgName.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now(),
        }
      });

      // Create user
      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          firstName,
          lastName,
          role: 'admin', // First user in org becomes admin
        }
      });

      // Create member record
      await tx.member.create({
        data: {
          userId: user.id,
          organisationId: organisation.id,
          role: 'ADMIN',
        }
      });

      return { user, organisation };
    });

    // Generate tokens
    const token = jwt.sign(
      { 
        userId: result.user.id, 
        email: result.user.email, 
        role: result.user.role || 'member' 
      },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: result.user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    await audit.log({
      action: 'user.register',
      resource: 'user',
      resourceId: result.user.id,
      actor: { id: result.user.id, email: result.user.email },
      organisationId: result.organisation.id,
      ipAddress: req.ip,
    });

    res.status(201).json({
      accessToken: token,
      refreshToken: refreshToken,
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        role: result.user.role,
      },
      organisation: {
        id: result.organisation.id,
        name: result.organisation.name,
      }
    });
  } catch (err) {
    next(err);
  }
}

// ─── Login ─────────────────────────────────────────────────────────
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      logger.warn('Login attempt with non-existent email', { email });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      logger.warn('Login attempt with invalid password', { email });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Include role in the JWT
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role || 'member' 
      },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    logger.info('User logged in', { userId: user.id, email: user.email });

    res.json({
      accessToken: token,
      refreshToken: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role || 'member',
      }
    });
  } catch (err) {
    next(err);
  }
}

// ─── Refresh Token ───────────────────────────────────────────────
async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role || 'member' 
      },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    res.json({ accessToken: token });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Refresh token expired' });
    }
    next(err);
  }
}

// ─── Logout ───────────────────────────────────────────────────────
async function logout(req, res, next) {
  try {
    // In a real implementation, you'd blacklist the token
    // For now, just return success
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
}

// ─── Forgot Password ──────────────────────────────────────────────
async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Don't reveal if user exists or not for security
      return res.json({ message: 'If an account exists, a reset link has been sent' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: hashedToken,
        resetTokenExpiry: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      }
    });

    // In a real app, send email with reset link
    // For now, just log it
    logger.info('Password reset requested', { email, token: resetToken });

    res.json({ message: 'If an account exists, a reset link has been sent' });
  } catch (err) {
    next(err);
  }
}

// ─── Reset Password ──────────────────────────────────────────────
async function resetPassword(req, res, next) {
  try {
    const { token, password } = req.body;

    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await prisma.user.findFirst({
      where: {
        resetToken: hashedToken,
        resetTokenExpiry: { gt: new Date() },
      }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
      }
    });

    logger.info('Password reset successfully', { userId: user.id });
    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    next(err);
  }
}

// ─── Get Current User ──────────────────────────────────────────────
async function me(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
  me,
};
