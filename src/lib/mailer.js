const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === 'true', // true for port 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendInviteEmail({ to, token, orgName }) {
  const url = `${process.env.FRONTEND_URL}/accept-invite?token=${token}`;

  await transporter.sendMail({
    from: process.env.SMTP_FROM || '"OppShield" <no-reply@oppshield.io>',
    to,
    subject: `You've been invited to join ${orgName || 'an organisation'} on OppShield`,
    html: `
      <p>You've been invited to join <strong>${orgName || 'an organisation'}</strong> on OppShield.</p>
      <p><a href="${url}">Click here to accept your invite</a></p>
      <p>This link expires in 7 days.</p>
    `,
  });
}

module.exports = { sendInviteEmail };
