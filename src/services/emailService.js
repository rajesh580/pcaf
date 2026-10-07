const nodemailer = require('nodemailer');

// Configure Gmail SMTP transport
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT, 10) || 465,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Send an email verification link with a token
 */
async function sendVerificationEmail(recipientEmail, verificationToken) {
  const verifyUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;

  const mailOptions = {
    from: process.env.FROM_EMAIL || `"PFAC Portal" <${process.env.SMTP_USER}>`,
    to: recipientEmail,
    subject: 'Verify Your Email - Academia-Industry Collaboration Portal',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #1e3a8a;">Academia-Industry Collaboration Portal</h2>
        <p>Thank you for registering. Please confirm your email address to activate your account and access skill mapping, internships, and placements.</p>
        <div style="margin: 30px 0;">
          <a href="${verifyUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Verify Email Address
          </a>
        </div>
        <p style="color: #64748b; font-size: 14px;">Or copy and paste this link into your browser:</p>
        <p style="color: #2563eb; font-size: 13px; word-break: break-all;">${verifyUrl}</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="color: #94a3b8; font-size: 12px;">This link will expire in 24 hours. If you did not create an account, please ignore this email.</p>
      </div>
    `,
  };

  return await transporter.sendMail(mailOptions);
}

/**
 * Send password reset email
 */
async function sendPasswordResetEmail(recipientEmail, resetToken) {
  const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: process.env.FROM_EMAIL || `"PFAC Portal" <${process.env.SMTP_USER}>`,
    to: recipientEmail,
    subject: 'Password Reset Request - Academia-Industry Collaboration Portal',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #1e3a8a;">Password Reset</h2>
        <p>You requested to reset your password. Click the button below to set a new password:</p>
        <div style="margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #dc2626; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p style="color: #64748b; font-size: 14px;">Or copy and paste this link into your browser:</p>
        <p style="color: #2563eb; font-size: 13px; word-break: break-all;">${resetUrl}</p>
        <p style="color: #94a3b8; font-size: 12px;">This link expires in 1 hour. If you did not make this request, please ignore this email.</p>
      </div>
    `,
  };

  return await transporter.sendMail(mailOptions);
}

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
};
