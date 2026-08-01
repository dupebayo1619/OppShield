// src/controllers/auth.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { generateSecret, generateURI, verify } = require('otplib');
const qrcode = require('qrcode');
const prisma = require('../lib/prisma');
const logger = require('../lib/logger');
const audit = require('../lib/audit');
const { encrypt, decrypt } = require('../lib/mfa');

// ─── Cookie Helpers ──────────────────────────────────────────────
function setAuthCookies(res, accessToken, refreshToken) {
  const isSecure = process.env.NODE_ENV === 'production';
  const cookieOptions = {
    httpOnly: true,
    secure: isSecure,
    sameSite: isSecure ? 'none' : 'lax',
    path: '/',
  };

  res.cookie('accessToken', accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  res.cookie('refreshToken', refreshToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

// ─── Register ──────────────────────────────────────────────────────
async function register(req, res, next) {
  try {
    const { email, password, firstName, lastName, orgName } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    if (!password || password.length < 8) {
      return res.status(422).json({ error: 'Password must be at least 8 characters' });
    }
    const passwordHash = await bcrypt.hash(password, 12);

    const result = await prisma.$transaction(async (tx) => {
      const organisation = await tx.organisation.create({
        data: {
          name: orgName || `${firstName}'s Organisation`,
          slug: (orgName || `${firstName}'s Organisation`)
            .toLowerCase()
            .replace(/\s+/g, '-') + '-' + Date.now(),
        },
      });

      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          firstName,
          lastName,
          role: 'admin',
        },
      });

      await tx.member.create({
        data: {
          userId: user.id,
          organisationId: organisation.id,
          role: 'ADMIN',
        },
      });

      return { user, organisation };
    });

    const token = jwt.sign(
      { userId: result.user.id, email: result.user.email, role: result.user.role || 'member' },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: result.user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    setAuthCookies(res, token, refreshToken);

    await audit.log({
      action: 'user.register',
      resource: 'user',
      resourceId: result.user.id,
      actor: { id: result.user.id, email: result.user.email },
      organisationId: result.organisation.id,
    });

    res.status(201).json({
      accessToken: token,
      refreshToken,
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        role: result.user.role || 'member',
        organisationId: result.organisation.id,
      },
    });
  } catch (err) {
    console.error('❌ Registration error:', err);
    next(err);
  }
}

// ─── Login ────────────────────────────────────────────────────────
async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    console.log('📥 Login request body:', { email, password });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      console.log('❌ Invalid password for:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // ─── MFA Check ────────────────────────────────────────────────
    if (user.mfaEnabled) {
      // Don't issue full tokens yet — only a short-lived MFA token
      const mfaToken = jwt.sign(
        { userId: user.id, purpose: 'mfa' },
        process.env.JWT_SECRET,
        { expiresIn: '5m' }
      );
      const isSecure = process.env.NODE_ENV === 'production';
      res.cookie('mfaPending', mfaToken, {
        httpOnly: true,
        secure: isSecure,
        sameSite: isSecure ? 'none' : 'lax',
        maxAge: 5 * 60 * 1000,
        path: '/',
      });
      return res.status(200).json({
        mfaRequired: true,
        message: 'MFA verification required',
        userId: user.id,
      });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role || 'member' },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    setAuthCookies(res, token, refreshToken);

    await audit.log({
      action: 'user.login',
      resource: 'user',
      resourceId: user.id,
      actor: { id: user.id, email: user.email },
    });

    res.json({
      accessToken: token,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role || 'member',
      },
    });
  } catch (err) {
    console.error('❌ Login error:', err);
    next(err);
  }
}

// ─── Logout ──────────────────────────────────────────────────────
async function logout(req, res) {
  res.clearCookie('accessToken', { path: '/' });
  res.clearCookie('refreshToken', { path: '/' });
  res.clearCookie('mfaPending', { path: '/' });
  res.json({ message: 'Logged out successfully' });
}

// ─── Refresh Token ──────────────────────────────────────────────
async function refresh(req, res, next) {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    const newToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role || 'member' },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const newRefreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    setAuthCookies(res, newToken, newRefreshToken);

    res.json({
      accessToken: newToken,
      refreshToken: newRefreshToken,
    });
  } catch (err) {
    console.error('❌ Refresh error:', err);
    next(err);
  }
}

// ─── Get Current User ──────────────────────────────────────────
async function me(req, res) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        members: {
          include: {
            organisation: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role || 'member',
      organisations: user.members.map((m) => ({
        id: m.organisationId,
        name: m.organisation.name,
        slug: m.organisation.slug,
        role: m.role,
      })),
    });
  } catch (err) {
    console.error('❌ Me error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// ─── Forgot Password ─────────────────────────────────────────────
async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    // Always return success even if user not found (security best practice)
    if (!user) {
      return res.json({ message: 'If an account exists, a password reset link has been sent.' });
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
        resetTokenExpiry: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      },
    });

    // TODO: Send email with reset link
    console.log(`🔑 Reset token for ${email}: ${resetToken}`);

    res.json({
      message: 'If an account exists, a password reset link has been sent.',
      ...(process.env.NODE_ENV === 'development' && { resetToken }),
    });
  } catch (err) {
    console.error('❌ Forgot password error:', err);
    next(err);
  }
}

// ─── Reset Password ──────────────────────────────────────────────
async function resetPassword(req, res, next) {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await prisma.user.findFirst({
      where: {
        resetToken: hashedToken,
        resetTokenExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    console.error('❌ Reset password error:', err);
    next(err);
  }
}

// ═══════════════════════════════════════════════════════════════
// MFA (TOTP)
// ═══════════════════════════════════════════════════════════════

const MFA_PENDING_COOKIE = 'mfaPending';
const MFA_PENDING_MAX_AGE = 5 * 60 * 1000; // 5 minutes

function generateBackupCodes(count = 10) {
  const codes = [];
  for (let i = 0; i < count; i++) {
    codes.push(crypto.randomBytes(5).toString('hex')); // 10-char codes
  }
  return codes;
}

// ─── Setup MFA (generate secret + QR) ─────────────────────────
async function setupMfa(req, res, next) {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user.mfaEnabled) {
      return res.status(400).json({ error: 'MFA is already enabled for this account' });
    }

    const secret = generateSecret();
    const otpauthUrl = generateURI({ issuer: 'OpsShield', label: user.email, secret });
    const qrCodeDataUrl = await qrcode.toDataURL(otpauthUrl);

    // Store encrypted secret temporarily — not marked enabled until verified
    await prisma.user.update({
      where: { id: userId },
      data: { mfaSecret: encrypt(secret) },
    });

    res.json({
      qrCode: qrCodeDataUrl,
      secret, // shown once for manual entry if QR scan fails
    });
  } catch (err) {
    console.error('❌ MFA setup error:', err);
    next(err);
  }
}

// ─── Verify MFA setup (confirm first code, enable MFA) ────────
async function verifyMfaSetup(req, res, next) {
  try {
    const userId = req.user.id;
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Verification code is required' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user.mfaSecret) {
      return res.status(400).json({ error: 'MFA setup has not been started' });
    }

    const secret = decrypt(user.mfaSecret);
    const totpResult = await verify({ token: code, secret });
    const isValid = totpResult.valid;

    if (!isValid) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    const backupCodes = generateBackupCodes();
    const hashedBackupCodes = await Promise.all(
      backupCodes.map((c) => bcrypt.hash(c, 10))
    );

    await prisma.user.update({
      where: { id: userId },
      data: {
        mfaEnabled: true,
        mfaBackupCodes: hashedBackupCodes,
      },
    });

    await audit.log({
      action: 'user.mfa.enabled',
      resource: 'user',
      resourceId: userId,
      actor: { id: userId, email: user.email },
      ipAddress: req.ip,
    });

    res.json({
      message: 'MFA enabled successfully',
      backupCodes, // shown once — user must save these
    });
  } catch (err) {
    console.error('❌ MFA verify setup error:', err);
    next(err);
  }
}

// ─── Verify MFA during login (second factor) ──────────────────
async function verifyMfaLogin(req, res, next) {
  try {
    const mfaToken = req.cookies?.[MFA_PENDING_COOKIE];
    const { code } = req.body;

    if (!mfaToken) {
      return res.status(401).json({ error: 'MFA verification session expired, please log in again' });
    }
    if (!code) {
      return res.status(400).json({ error: 'Verification code is required' });
    }

    let decoded;
    try {
      decoded = jwt.verify(mfaToken, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ error: 'MFA verification session expired, please log in again' });
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user || !user.mfaEnabled || !user.mfaSecret) {
      return res.status(401).json({ error: 'Invalid MFA session' });
    }

    const secret = decrypt(user.mfaSecret);
    const totpResult = await verify({ token: code, secret });
    let isValid = totpResult.valid;

    // Fall back to backup codes if TOTP code doesn't match
    let usedBackupCode = null;
    if (!isValid) {
      for (const hashedCode of user.mfaBackupCodes) {
        if (await bcrypt.compare(code, hashedCode)) {
          isValid = true;
          usedBackupCode = hashedCode;
          break;
        }
      }
    }

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid verification code' });
    }

    // If a backup code was used, remove it (one-time use)
    if (usedBackupCode) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          mfaBackupCodes: user.mfaBackupCodes.filter((c) => c !== usedBackupCode),
        },
      });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role || 'member' },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );
    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    res.clearCookie(MFA_PENDING_COOKIE, { path: '/' });
    setAuthCookies(res, token, refreshToken);

    res.json({
      accessToken: token,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role || 'member',
      },
      ...(usedBackupCode && { warning: 'A backup code was used. Remaining backup codes: ' + (user.mfaBackupCodes.length - 1) }),
    });
  } catch (err) {
    console.error('❌ MFA login verify error:', err);
    next(err);
  }
}

// ─── Disable MFA (requires password + current code) ────────────
async function disableMfa(req, res, next) {
  try {
    const userId = req.user.id;
    const { password, code } = req.body;

    if (!password || !code) {
      return res.status(400).json({ error: 'Password and verification code are required' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user.mfaEnabled) {
      return res.status(400).json({ error: 'MFA is not enabled' });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    const secret = decrypt(user.mfaSecret);
    const verifyResult = await verify({ token: code, secret });
    const validCode = verifyResult.valid;
    if (!validCode) {
      return res.status(401).json({ error: 'Invalid verification code' });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { mfaEnabled: false, mfaSecret: null, mfaBackupCodes: [] },
    });

    await audit.log({
      action: 'user.mfa.disabled',
      resource: 'user',
      resourceId: userId,
      actor: { id: userId, email: user.email },
      ipAddress: req.ip,
    });

    res.json({ message: 'MFA disabled successfully' });
  } catch (err) {
    console.error('❌ MFA disable error:', err);
    next(err);
  }
}

// ─── Exports ──────────────────────────────────────────────────────
module.exports = {
  register,
  login,
  logout,
  refresh,
  me,
  forgotPassword,
  resetPassword,
  setupMfa,
  verifyMfaSetup,
  verifyMfaLogin,
  disableMfa,
  MFA_PENDING_COOKIE,
  MFA_PENDING_MAX_AGE,
};
