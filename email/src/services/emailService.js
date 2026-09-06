const nodemailer = require('nodemailer');

function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port: Number(port) || 587,
      secure: Number(port) === 465,
      auth: { user, pass }
    });
  }

  return nodemailer.createTransport({
    jsonTransport: true
  });
}

const TEMPLATES = {
  WELCOME_EMAIL: (data) => ({
    subject: 'Welcome to Distributed Log Analytics Platform!',
    text: `Hello,\n\nWelcome to our platform! Your account has been registered successfully.\n\nBest regards,\nTeam`
  }),
  ORDER_CONFIRMATION_EMAIL: (data) => ({
    subject: `Order Confirmation - #${data.orderId || 'N/A'}`,
    text: `Hello,\n\nThank you for your order! Your order #${data.orderId || ''} has been confirmed.\n\nBest regards,\nTeam`
  }),
  PAYMENT_FAILURE_EMAIL: (data) => ({
    subject: `Payment Failed - Order #${data.orderId || 'N/A'}`,
    text: `Hello,\n\nWe could not process payment for order #${data.orderId || ''}. Please try again or update your payment details.\n\nBest regards,\nTeam`
  }),
  ORDER_CANCELLATION_EMAIL: (data) => ({
    subject: `Order Cancelled - #${data.orderId || 'N/A'}`,
    text: `Hello,\n\nYour order #${data.orderId || ''} has been cancelled successfully.\n\nBest regards,\nTeam`
  })
};

async function sendEmail({ type, to, userId, orderId }) {
  const transporter = createTransporter();
  const templateFn = TEMPLATES[type];

  if (!templateFn) {
    throw new Error(`Unsupported email type: ${type}`);
  }

  const { subject, text } = templateFn({ userId, orderId });
  const from = process.env.SMTP_FROM || 'noreply@logcollector.local';

  const mailOptions = {
    from,
    to,
    subject,
    text
  };

  const info = await transporter.sendMail(mailOptions);
  return info;
}

module.exports = {
  sendEmail,
  TEMPLATES
};
