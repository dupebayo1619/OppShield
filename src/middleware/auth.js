const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ─── Authentication Middleware ────────────────────────────────────
const authenticate = async (req, res, next) => {
  console.log('🔐 authenticate middleware STARTED');
  
  try {
    const authHeader = req.headers.authorization;
    console.log(`📌 Auth header present: ${!!authHeader}`);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No Bearer token found');
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    console.log(`📌 Token received: ${token.substring(0, 20)}...`);

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    console.log(`📌 Token decoded: userId=${decoded.userId}`);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        members: {
          include: {
            organisation: true
          }
        }
      }
    });

    if (!user) {
      console.log(`❌ User not found: ${decoded.userId}`);
      return res.status(401).json({ error: 'User not found' });
    }

    console.log(`✅ User authenticated: ${user.id} Role: ${user.role || 'MEMBER'}`);
    req.user = user;
    next();
  } catch (error) {
    console.error('❌ Authentication error:', error.message);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    res.status(500).json({ error: 'Authentication failed' });
  }
};

// ─── Require Admin Middleware ─────────────────────────────────────
const requireAdmin = (req, res, next) => {
  console.log('🔑 requireAdmin middleware STARTED');
  
  if (!req.user) {
    console.log('❌ No user found in request');
    return res.status(401).json({ error: 'Authentication required' });
  }

  const isAdmin = req.user.role === 'ADMIN' || 
                   req.user.members?.some(m => m.role === 'ADMIN');

  if (!isAdmin) {
    console.warn('🔒 Admin access denied for user:', req.user.id);
    return res.status(403).json({ error: 'Admin access required' });
  }

  console.log('🔑 Admin access granted for user:', req.user.id);
  next();
};

// ─── Require Org Member Middleware ───────────────────────────────
const requireOrgMember = async (req, res, next) => {
  console.log('👥 requireOrgMember middleware STARTED');
  
  try {
    const { orgId } = req.params;
    
    if (!orgId) {
      console.log('❌ No orgId in request params');
      return res.status(400).json({ error: 'Organisation ID required' });
    }

    if (!req.user) {
      console.log('❌ No user found in request');
      return res.status(401).json({ error: 'Authentication required' });
    }

    console.log(`🔍 Checking membership for user ${req.user.id} in org ${orgId}`);
    
    const member = await prisma.member.findFirst({
      where: {
        userId: req.user.id,
        organisationId: orgId,
      }
    });

    if (!member) {
      console.log(`❌ User ${req.user.id} is not a member of org ${orgId}`);
      return res.status(403).json({ error: 'You are not a member of this organisation' });
    }

    console.log(`✅ User ${req.user.id} is a member of org ${orgId}`);
    req.organisation = { id: orgId };
    next();
  } catch (error) {
    console.error('❌ requireOrgMember error:', error);
    res.status(500).json({ error: 'Failed to verify membership' });
  }
};

module.exports = {
  authenticate,
  requireAdmin,
  requireOrgMember
};
