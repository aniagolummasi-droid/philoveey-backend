import crypto from 'crypto'
import Order from '../models/Order.js'
import Transaction from '../models/Transaction.js'

function getClientUrl() {
  if (process.env.CLIENT_URL) {
    return process.env.CLIENT_URL.split(',')[0].trim()
  }

  return process.env.NODE_ENV === 'production'
    ? 'https://philoveeystore.com.ng'
    : 'http://localhost:5173'
}

function getPaystackCallbackUrl() {
  return process.env.PAYSTACK_CALLBACK_URL || `${getClientUrl()}/#payment-status`
}

function getPaystackSecretKey() {
  if (!process.env.PAYSTACK_SECRET_KEY) {
    throw new Error('PAYSTACK_SECRET_KEY is not configured')
  }

  return process.env.PAYSTACK_SECRET_KEY
}

function getPaystackSignature(payload) {
  return crypto
    .createHmac('sha512', getPaystackSecretKey())
    .update(payload)
    .digest('hex')
}

function mapPaystackStatus(status) {
  return status === 'success' ? 'paid' : 'failed'
}

async function finalizePaystackPayment(paymentData) {
  const reference = paymentData.reference
  const orderId = paymentData.metadata?.orderId
  const orderQuery = orderId
    ? { _id: orderId, paymentReference: reference }
    : { paymentReference: reference }
  const order = await Order.findOne(orderQuery)

  if (!order) {
    const error = new Error('Order not found for this payment reference')
    error.statusCode = 404
    throw error
  }

  const expectedAmount = Math.round(Number(order.total) * 100)
  if (Number(paymentData.amount) !== expectedAmount) {
    const error = new Error('Payment amount does not match this order')
    error.statusCode = 400
    throw error
  }

  const paymentStatus = mapPaystackStatus(paymentData.status)

  order.paymentStatus = paymentStatus
  if (paymentStatus === 'paid') {
    order.orderStatus = 'processing'
    order.paidAt = paymentData.paid_at ? new Date(paymentData.paid_at) : new Date()
  }
  await order.save()

  await Transaction.findOneAndUpdate(
    { reference },
    {
      amount: order.total,
      order: order._id,
      provider: 'paystack',
      rawResponse: paymentData,
      reference,
      status: paymentStatus,
      user: order.user,
    },
    { new: true, upsert: true },
  )

  return order
}

export async function initializePayment(req, res, next) {
  try {
    const order = await Order.findById(req.params.orderId).populate(
      'user',
      'email',
    )

    if (!order) {
      res.status(404)
      throw new Error('Order not found')
    }

    if (order.user._id.toString() !== req.user._id.toString()) {
      res.status(403)
      throw new Error('Not allowed to pay for this order')
    }

    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${getPaystackSecretKey()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: order.total * 100,
        email: order.user.email,
        reference: `PHILOVEEY-${order._id}-${Date.now()}`,
        callback_url: getPaystackCallbackUrl(),
        metadata: { orderId: order._id.toString() },
      }),
    })

    const data = await response.json()

    if (!response.ok || !data.status) {
      res.status(400)
      throw new Error(data.message || 'Unable to initialize payment')
    }

    order.paymentReference = data.data.reference
    await order.save()

    await Transaction.findOneAndUpdate(
      { order: order._id },
      {
        amount: order.total,
        order: order._id,
        provider: 'paystack',
        rawResponse: data.data,
        reference: data.data.reference,
        status: 'pending',
        user: order.user._id,
      },
      { new: true, upsert: true },
    )

    res.json(data.data)
  } catch (error) {
    next(error)
  }
}

export async function verifyPayment(req, res, next) {
  try {
    const { reference } = req.params

    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${getPaystackSecretKey()}`,
        },
      },
    )
    const data = await response.json()

    if (!response.ok || !data.status) {
      res.status(400)
      throw new Error(data.message || 'Unable to verify payment')
    }

    const order = await finalizePaystackPayment(data.data)

    res.json({ payment: data.data, order })
  } catch (error) {
    if (error.statusCode) {
      res.status(error.statusCode)
    }
    next(error)
  }
}

export async function handlePaystackWebhook(req, res, next) {
  try {
    const payload = req.body
    const signature = req.get('x-paystack-signature')

    if (!Buffer.isBuffer(payload) || !signature) {
      res.status(400)
      throw new Error('Invalid Paystack webhook payload')
    }

    const expectedSignature = getPaystackSignature(payload)
    const isValidSignature =
      signature.length === expectedSignature.length &&
      crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature),
      )

    if (!isValidSignature) {
      res.status(401)
      throw new Error('Invalid Paystack webhook signature')
    }

    const event = JSON.parse(payload.toString('utf8'))

    if (event.event === 'charge.success' || event.event === 'charge.failed') {
      await finalizePaystackPayment(event.data)
    }

    res.sendStatus(200)
  } catch (error) {
    if (error.statusCode) {
      res.status(error.statusCode)
    }
    next(error)
  }
}
