import nodemailer from 'nodemailer'

function createTransporter() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return null
  }

  return nodemailer.createTransport({
    auth: {
      pass: process.env.SMTP_PASS,
      user: process.env.SMTP_USER,
    },
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
  })
}

export async function sendEmail({ html, subject, text, to }) {
  const transporter = createTransporter()

  if (!transporter) {
    console.warn('Email skipped: SMTP is not configured')
    return
  }

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
    html,
    subject,
    text,
    to,
  })
}

export async function sendOrderEmails({ order, user }) {
  const adminEmail = process.env.ADMIN_EMAIL

  await Promise.all([
    user?.email
      ? sendEmail({
          subject: 'Your PhiloVeey order has been received',
          text: `Thank you for your order. Order ID: ${order._id}. Total: N${order.total}.`,
          to: user.email,
        })
      : null,
    adminEmail
      ? sendEmail({
          subject: 'New PhiloVeey order',
          text: `New order from ${user?.email || 'customer'}. Order ID: ${order._id}. Total: N${order.total}.`,
          to: adminEmail,
        })
      : null,
  ])
}
