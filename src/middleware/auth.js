const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

const authenticate = (req, res, next) => {
  try {
    // Prefer the httpOnly cookie set by login/refresh
    let token = req.cookies?.accessToken;

    // Fallback: allow Authorization header too (useful for non-browser clients/testing)
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }
    }

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      id: decoded.userId || decoded.id || decoded.sub,
      email: decoded.email,
      role: decoded.role || 'member',
      ...decoded
    };

    console.log('🔐 User authenticated:', req.user.id, 'Role:', req.user.role);
    next();
  } catch (error) {
    console.error('Auth error:', error.message);

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }

    return res.status(401).json({ error: 'Authentication failed' });
  }
};

const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.user.role !== 'admin') {
    console.warn('🔒 Admin access denied for user:', req.user.id, 'Role:', req.user.role);
    return res.status(403).json({ error: 'Admin access required' });
  }

  console.log('🔑 Admin access granted for user:', req.user.id);
  next();
};

const requireOrgMember = async (req, res, next) => {
  try {
    const { orgId } = req.params;

    const member = await prisma.member.findFirst({
      where: {
        userId: req.user.id,
        organisationId: orgId,
      }
    });

    if (!member) {
      return res.status(403).json({ error: 'You are not a member of this organisation' });
    }

    req.organisation = { id: orgId };
    req.member = member;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { authenticate, requireAdmin, requireOrgMember };
