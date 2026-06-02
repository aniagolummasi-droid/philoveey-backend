import Cart from '../models/Cart.js'
import Product from '../models/Product.js'

async function getOrCreateCart(userId) {
  let cart = await Cart.findOne({ user: userId }).populate('items.product')

  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] })
    cart = await cart.populate('items.product')
  }

  return cart
}

export async function getCart(req, res, next) {
  try {
    const cart = await getOrCreateCart(req.user._id)
    res.json(cart)
  } catch (error) {
    next(error)
  }
}

export async function addToCart(req, res, next) {
  try {
    const { productId, quantity = 1 } = req.body
    const product = await Product.findById(productId)

    if (!product || !product.isActive) {
      res.status(404)
      throw new Error('Product not found')
    }

    const cart = await getOrCreateCart(req.user._id)
    const existingItem = cart.items.find(
      (item) => item.product._id.toString() === productId,
    )

    if (existingItem) {
      existingItem.quantity += Number(quantity)
    } else {
      cart.items.push({ product: productId, quantity })
    }

    await cart.save()
    await cart.populate('items.product')

    res.status(201).json(cart)
  } catch (error) {
    next(error)
  }
}

export async function updateCartItem(req, res, next) {
  try {
    const { quantity } = req.body
    const cart = await getOrCreateCart(req.user._id)
    const item = cart.items.find(
      (cartItem) => cartItem.product._id.toString() === req.params.productId,
    )

    if (!item) {
      res.status(404)
      throw new Error('Cart item not found')
    }

    item.quantity = Number(quantity)
    cart.items = cart.items.filter((cartItem) => cartItem.quantity > 0)

    await cart.save()
    await cart.populate('items.product')

    res.json(cart)
  } catch (error) {
    next(error)
  }
}

export async function removeCartItem(req, res, next) {
  try {
    const cart = await getOrCreateCart(req.user._id)

    cart.items = cart.items.filter(
      (item) => item.product._id.toString() !== req.params.productId,
    )

    await cart.save()
    await cart.populate('items.product')

    res.json(cart)
  } catch (error) {
    next(error)
  }
}

export async function clearCart(req, res, next) {
  try {
    const cart = await getOrCreateCart(req.user._id)
    cart.items = []
    await cart.save()

    res.json(cart)
  } catch (error) {
    next(error)
  }
}
