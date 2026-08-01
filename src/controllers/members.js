const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');
const audit  = require('../lib/audit');
const logger = require('../lib/logger');
const { sendInviteEmail } = require('../lib/mailer');

async function invite(req, res, next) {
  try {
    const { email, role = 'MEMBER' } = req.body;

    // Check if already a member
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      const existing = await prisma.member.findUnique({
        where: {
          userId_organisationId: {
            userId:         existingUser.id,
            organisationId: req.organisation.id,
          }
        }
      });
      if (existing) return res.status(409).json({ error: 'User is already a member' });
    }

    const token = crypto.randomBytes(32).toString('hex');

    const invite = await prisma.invite.create({
      data: {
        email,
        token,
        role,
        organisationId: req.organisation.id,
        invitedById:    req.user.id,
        expiresAt:      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      }
    });

    // Send invite email
    try {
      await sendInviteEmail({
        to: email,
        token: invite.token,
        orgName: req.organisation.name,
      });
      logger.info('Invite email sent', { email, orgId: req.organisation.id });
    } catch (mailErr) {
      logger.error('Failed to send invite email', { error: mailErr.message, email });
      // Don't fail the request if email fails - invite is still created
    }

    await audit.log({
      action:         'member.invite',
      resource:       'invite',
      resourceId:     invite.id,
      actor:          req.user,
      organisationId: req.organisation.id,
      metadata:       { email, role },
      ipAddress:      req.ip,
    });

    return res.status(201).json({ message: 'Invitation sent', inviteId: invite.id });
  } catch (err) { 
    logger.error('Invite error:', err);
    next(err); 
  }
}

async function acceptInvite(req, res, next) {
  try {
    const { token, password, firstName, lastName } = req.body;

    const invite = await prisma.invite.findUnique({ 
      where: { token },
      include: { organisation: true }
    });
    
    if (!invite || invite.expiresAt < new Date() || invite.status !== 'PENDING') {
      return res.status(400).json({ error: 'Invalid or expired invitation' });
    }

    let user = await prisma.user.findUnique({ where: { email: invite.email } });

    if (!user) {
      // New user — requires name and password
      if (!password || !firstName || !lastName) {
        return res.status(400).json({ error: 'firstName, lastName, and password required for new users' });
      }
      const passwordHash = await bcrypt.hash(password, 12);
      user = await prisma.user.create({
        data: { 
          email: invite.email, 
          passwordHash, 
          firstName, 
          lastName,
          role: 'member',
        }
      });
    }

    await prisma.$transaction([
      prisma.member.create({
        data: {
          userId:         user.id,
          organisationId: invite.organisationId,
          role:           invite.role,
        }
      }),
      prisma.invite.update({
        where: { id: invite.id },
        data:  { status: 'ACCEPTED' },
      }),
    ]);

    await audit.log({
      action:         'member.invite.accepted',
      resource:       'member',
      resourceId:     user.id,
      actor:          { id: user.id, email: user.email },
      organisationId: invite.organisationId,
      ipAddress:      req.ip,
    });

    return res.json({ message: 'Invitation accepted' });
  } catch (err) { 
    logger.error('Accept invite error:', err);
    next(err); 
  }
}

async function remove(req, res, next) {
  try {
    const { memberId } = req.params;

    // Cannot remove yourself
    const member = await prisma.member.findFirst({
      where: { id: memberId, organisationId: req.organisation.id }
    });
    if (!member) return res.status(404).json({ error: 'Member not found' });
    if (member.userId === req.user.id) {
      return res.status(400).json({ error: 'You cannot remove yourself' });
    }

    await prisma.member.delete({ where: { id: member.id } });

    await audit.log({
      action:         'member.remove',
      resource:       'member',
      resourceId:     memberId,
      actor:          req.user,
      organisationId: req.organisation.id,
      ipAddress:      req.ip,
    });

    return res.json({ message: 'Member removed' });
  } catch (err) { 
    logger.error('Remove member error:', err);
    next(err); 
  }
}

async function updateRole(req, res, next) {
  try {
    const { memberId } = req.params;
    const { role } = req.body;

    const member = await prisma.member.findFirst({
      where: { id: memberId, organisationId: req.organisation.id }
    });
    if (!member) return res.status(404).json({ error: 'Member not found' });
    if (member.userId === req.user.id) {
      return res.status(400).json({ error: 'You cannot change your own role' });
    }

    const updated = await prisma.member.update({
      where: { id: member.id },
      data:  { role },
    });

    await audit.log({
      action:         'member.role.update',
      resource:       'member',
      resourceId:     memberId,
      actor:          req.user,
      organisationId: req.organisation.id,
      metadata:       { role },
      ipAddress:      req.ip,
    });

    return res.json({ member: updated });
  } catch (err) { 
    logger.error('Update role error:', err);
    next(err); 
  }
}

module.exports = { invite, acceptInvite, remove, updateRole };
