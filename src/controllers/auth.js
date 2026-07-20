// src/controllers/auth.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const prisma = require('../lib/prisma');
const logger = require('../lib/logger');
const audit = require('../lib/audit');

// ─── Register ──────────────────────────────────────────────────────
async function register(req, res, next) {
  try {
    const { email, password, firstName, lastName, orgName } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await prisma.$transaction(async (tx) => {
      const organisation = await tx.organisation.create({
        data: {
          name: orgName,
          slug: orgName.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now(),
        }
      });

      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          firstName,
          lastName,
          role: 'admin',
        }
      });

      await tx.member.create({
        data: {
          userId: user.id,
          organisationId: organisation.id,
          role: 'ADMIN',
        }
      });

      return { user, organisation };
    });

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
    console.error('❌ Register error:', err);
    next(err);
  }
}

// ─── Login ─────────────────────────────────────────────────────────
async function login(req, res, next) {
  try {
    console.log('📥 Login request body:', req.body);
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
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

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

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
    console.error('❌ Login error:', err);
    res.status(500).json({ error: 'An unexpected error occurred' });
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
    console.error('❌ Refresh error:', err);
    res.status(500).json({ error: 'An unexpected error occurred' });
  }
}

// ─── Logout ───────────────────────────────────────────────────────
async function logout(req, res, next) {
  try {
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error('❌ Logout error:', err);
    next(err);
  }
}

// ─── Forgot Password ──────────────────────────────────────────────
async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.json({ message: 'If an account exists, a reset link has been sent' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: hashedToken,
        resetTokenExpiry: new Date(Date.now() + 15 * 60 * 1000),
      }
    });

    logger.info('Password reset requested', { email, token: resetToken });
    res.json({ message: 'If an account exists, a reset link has been sent' });
  } catch (err) {
    console.error('❌ Forgot password error:', err);
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

    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    console.error('❌ Reset password error:', err);
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
    console.error('❌ Me error:', err);
    next(err);
  }
}

// ─── Exports ──────────────────────────────────────────────────────
module.exports = {
  register,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
  me,
};
