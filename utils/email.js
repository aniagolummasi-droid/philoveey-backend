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
    port: 465,
    secure: true,
    connectionUrl: `smtps://${process.env.SMTP_USER}:${process.env.SMTP_PASS}@smtp.gmail.com:465`,
    logger: process.env.NODE_ENV === 'production' ? false : true,
    debug: process.env.NODE_ENV === 'production' ? false : true,
    pool: {
      maxConnections: 1,
      maxMessages: 100,
      rateDelta: 1000,
      rateLimit: 5,
    },
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

function renderUserOrderEmail(order) {
  return `
    <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1f1f1f; line-height: 1.6;">
      <div style="max-width: 560px; margin: 0 auto; padding: 24px; background: #ffffff; border-radius: 18px; border: 1px solid #ececec;">
        <h1 style="color: #8b653b; font-size: 28px; margin-bottom: 16px;">Thank you for your PhiloVeey order!</h1>
        <p style="font-size: 16px; margin: 0 0 16px;">We have received your order and are processing it now.</p>
        <p style="margin: 0 0 8px; font-weight: 700;">Order ID: <span style="color: #8b653b;">${order._id}</span></p>
        <p style="margin: 0 0 8px; font-weight: 700;">Total: <span style="color: #8b653b;">N${order.total}</span></p>
        <p style="margin: 0 0 16px;">A confirmation email has been sent, and we will update you when your items are on the way.</p>
        <div style="padding: 16px; background: #f7f3eb; border-radius: 12px; border: 1px solid #f0e6d8;">
          <p style="margin: 0; color: #555;">If you did not place this order, reply to this message or contact support immediately.</p>
        </div>
      </div>
    </div>
  `
}

function renderAdminOrderEmail(order, user) {
  return `
    <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1f1f1f; line-height: 1.6;">
      <div style="max-width: 560px; margin: 0 auto; padding: 24px; background: #ffffff; border-radius: 18px; border: 1px solid #ececec;">
        <h1 style="color: #8b653b; font-size: 28px; margin-bottom: 16px;">New PhiloVeey order received</h1>
        <p style="font-size: 16px; margin: 0 0 16px;">A new order has just been placed.</p>
        <p style="margin: 0 0 8px; font-weight: 700;">Order ID: <span style="color: #8b653b;">${order._id}</span></p>
        <p style="margin: 0 0 8px; font-weight: 700;">Customer: <span style="color: #8b653b;">${user?.email || 'Unknown'}</span></p>
        <p style="margin: 0 0 8px; font-weight: 700;">Total: <span style="color: #8b653b;">N${order.total}</span></p>
        <p style="margin: 0;">Check the admin dashboard to review order details and fulfill the order.</p>
      </div>
    </div>
  `
}

export async function sendOrderEmails({ order, user }) {
  const adminEmail = process.env.ADMIN_EMAIL

  await Promise.all([
    user?.email
      ? sendEmail({
          subject: 'Your PhiloVeey order has been received',
          text: `Thank you for your order. Order ID: ${order._id}. Total: N${order.total}.`,
          html: renderUserOrderEmail(order),
          to: user.email,
        })
      : null,
    adminEmail
      ? sendEmail({
          subject: 'New PhiloVeey order',
          text: `New order from ${user?.email || 'customer'}. Order ID: ${order._id}. Total: N${order.total}.`,
          html: renderAdminOrderEmail(order, user),
          to: adminEmail,
        })
      : null,
  ])
}
