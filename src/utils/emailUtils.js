const config = require('../config/env');
const logger = require('./logger');

function createTransporter() {
  if (config.server.nodeEnv === 'development' || !config.email.user) {
    return null;
  }

  const nodemailer = require('nodemailer');
  return nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: config.email.port === 465,
    auth: {
      user: config.email.user,
      pass: config.email.pass
    }
  });
}

async function sendMail({ to, subject, text, html }) {
  const transporter = createTransporter();
  if (!transporter) {
    logger.info('Email delivery skipped; logging email content', { to, subject, text });
    return { logged: true };
  }

  return transporter.sendMail({
    from: config.email.user,
    to,
    subject,
    text,
    html
  });
}

function verificationUrl(token) {
  return `${config.server.frontendUrl}/verify-email?token=${token}`;
}

function resetUrl(token) {
  return `${config.server.frontendUrl}/reset-password?token=${token}`;
}

function inviteUrl(token) {
  return `${config.server.frontendUrl}/accept-invite?token=${token}`;
}

function sendVerificationEmail(to, token, name = 'there') {
  const url = verificationUrl(token);
  return sendMail({
    to,
    subject: 'Verify your email',
    text: `Hi ${name}, verify your email here: ${url}`,
    html: `<p>Hi ${name},</p><p>Verify your email here: <a href="${url}">${url}</a></p>`
  });
}

function sendPasswordResetEmail(to, token, name = 'there') {
  const url = resetUrl(token);
  return sendMail({
    to,
    subject: 'Reset your password',
    text: `Hi ${name}, reset your password here: ${url}`,
    html: `<p>Hi ${name},</p><p>Reset your password here: <a href="${url}">${url}</a></p>`
  });
}

function sendTeamInviteEmail(to, token, orgName, role) {
  const url = inviteUrl(token);
  return sendMail({
    to,
    subject: `You were invited to ${orgName}`,
    text: `You were invited to ${orgName} as ${role}. Accept here: ${url}`,
    html: `<p>You were invited to <strong>${orgName}</strong> as <strong>${role}</strong>.</p><p><a href="${url}">Accept invite</a></p>`
  });
}

module.exports = {
  createTransporter,
  sendPasswordResetEmail,
  sendTeamInviteEmail,
  sendVerificationEmail
};
