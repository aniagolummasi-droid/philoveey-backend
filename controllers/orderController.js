import Order from '../models/Order.js'
import Product from '../models/Product.js'
import Transaction from '../models/Transaction.js'
import { sendOrderEmails } from '../utils/email.js'

async function buildOrderItems(items) {
  const orderItems = []

  for (const item of items) {
    const product = await Product.findById(item.product)

    if (!product || !product.isActive) {
      throw new Error('One or more products are unavailable')
    }

    if (product.stock < item.quantity) {
      throw new Error(`${product.name} does not have enough stock`)
    }

    orderItems.push({
      product: product._id,
      name: product.name,
      image: product.images[0],
      price: product.price,
      quantity: item.quantity,
    })
  }

  return orderItems
}

export async function createOrder(req, res, next) {
  try {
    const { items, shippingAddress, paymentMethod = 'paystack' } = req.body

    if (!items?.length) {
      res.status(400)
      throw new Error('Order items are required')
    }

    const orderItems = await buildOrderItems(items)
    const subtotal = orderItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    )
    const deliveryFee = subtotal >= 25000 ? 0 : 2000
    const total = subtotal + deliveryFee

    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      shippingAddress,
      subtotal,
      deliveryFee,
      total,
      paymentMethod,
    })

    await Transaction.create({
      amount: total,
      order: order._id,
      provider: paymentMethod,
      status: 'pending',
      user: req.user._id,
    })

    await Promise.all(
      orderItems.map((item) =>
        Product.findByIdAndUpdate(item.product, {
          $inc: { stock: -item.quantity },
        }),
      ),
    )

    sendOrderEmails({ order, user: req.user }).catch((emailError) => {
      console.error(`Order email failed: ${emailError.message}`)
    })

    res.status(201).json(order)
  } catch (error) {
    next(error)
  }
}

export async function getMyOrders(req, res, next) {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({
      createdAt: -1,
    })

    res.json(orders)
  } catch (error) {
    next(error)
  }
}

export async function getOrders(req, res, next) {
  try {
    const orders = await Order.find({})
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 })

    res.json(orders)
  } catch (error) {
    next(error)
  }
}

export async function getOrderById(req, res, next) {
  try {
    const order = await Order.findById(req.params.id).populate(
      'user',
      'name email phone',
    )

    if (!order) {
      res.status(404)
      throw new Error('Order not found')
    }

    const isOwner = order.user._id.toString() === req.user._id.toString()
    const isAdmin = req.user.role === 'admin'

    if (!isOwner && !isAdmin) {
      res.status(403)
      throw new Error('Not allowed to view this order')
    }

    res.json(order)
  } catch (error) {
    next(error)
  }
}

export async function updateOrderStatus(req, res, next) {
  try {
    const order = await Order.findById(req.params.id)

    if (!order) {
      res.status(404)
      throw new Error('Order not found')
    }

    order.orderStatus = req.body.orderStatus ?? order.orderStatus
    const updatedOrder = await order.save()

    res.json(updatedOrder)
  } catch (error) {
    next(error)
  }
}
