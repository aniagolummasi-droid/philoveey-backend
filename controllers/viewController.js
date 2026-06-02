import Order from '../models/Order.js'
import Product from '../models/Product.js'
import User from '../models/User.js'
import { uploadImage } from '../utils/cloudinary.js'

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function parseList(value) {
  if (!value) return []

  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

export async function renderHome(req, res) {
  res.render('home', {
    title: 'Philoveey Backend',
  })
}

export async function renderAdminDashboard(req, res, next) {
  try {
    const [productCount, orderCount, userCount, recentOrders] =
      await Promise.all([
        Product.countDocuments({ isActive: true }),
        Order.countDocuments(),
        User.countDocuments(),
        Order.find({})
          .populate('user', 'name email')
          .sort({ createdAt: -1 })
          .limit(5),
      ])

    res.render('admin/dashboard', {
      title: 'Admin Dashboard',
      productCount,
      orderCount,
      userCount,
      recentOrders,
    })
  } catch (error) {
    next(error)
  }
}

export function renderAdminLogin(req, res) {
  res.render('admin-login', {
    title: 'Admin Login',
    error: req.query.error,
    success: req.query.success,
  })
}

export function renderAdminRegister(req, res) {
  res.render('admin-register', {
    title: 'Admin Register',
    adminEmail: process.env.ADMIN_EMAIL || '',
    adminPassword: process.env.ADMIN_PASSWORD || '',
    adminName: process.env.ADMIN_NAME || 'Philoveey Admin',
    error: req.query.error,
    success: req.query.success,
  })
}

async function ensureEnvAdmin(email, password, name) {
  if (
    email !== process.env.ADMIN_EMAIL ||
    password !== process.env.ADMIN_PASSWORD
  ) {
    const error = new Error('Invalid admin credentials')
    error.statusCode = 401
    throw error
  }

  const adminName = name || process.env.ADMIN_NAME || 'Admin'
  let admin = await User.findOne({ email })

  if (!admin) {
    admin = await User.create({
      email,
      name: adminName,
      password,
      role: 'admin',
    })
  } else {
    let updated = false

    if (admin.role !== 'admin') {
      admin.role = 'admin'
      updated = true
    }

    if (admin.name !== adminName) {
      admin.name = adminName
      updated = true
    }

    if (!(await admin.matchPassword(password))) {
      admin.password = password
      updated = true
    }

    if (updated) {
      await admin.save()
    }
  }

  return admin
}

export async function handleAdminLogin(req, res, next) {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      res.redirect('/admin/login?error=Email%20and%20password%20are%20required')
      return
    }

    await ensureEnvAdmin(email, password)
    res.redirect('/admin?success=Admin%20signed%20in')
  } catch (error) {
    const message = encodeURIComponent(error.message || 'Login failed')
    res.redirect(`/admin/login?error=${message}`)
  }
}

export async function handleAdminRegister(req, res, next) {
  try {
    const { name, email, password } = req.body

    if (!email || !password) {
      res.redirect('/admin/register?error=Email%20and%20password%20are%20required')
      return
    }

    await ensureEnvAdmin(email, password, name)
    res.redirect('/admin/register?success=Admin%20created%20or%20updated')
  } catch (error) {
    const message = encodeURIComponent(error.message || 'Register failed')
    res.redirect(`/admin/register?error=${message}`)
  }
}

export async function renderAdminProducts(req, res, next) {
  try {
    const products = await Product.find({ isActive: true }).sort({ createdAt: -1 })

    res.render('admin/products', {
      error: req.query.error,
      success: req.query.success,
      title: 'Products',
      products,
    })
  } catch (error) {
    next(error)
  }
}

export async function createAdminProduct(req, res, next) {
  try {
    const { category, color, description, name, price, sizes, stock } = req.body
    const bestSeller = req.body.bestSeller === 'true' || req.body.bestSeller === 'on'

    if (!name || !price || !category) {
      res.redirect('/admin/products?error=Name%2C%20price%2C%20and%20category%20are%20required')
      return
    }

    const imageUrl = await uploadImage(req.file)

    if (!imageUrl) {
      res.redirect('/admin/products?error=Product%20image%20is%20required')
      return
    }

    await Product.create({
      bestSeller,
      category,
      color,
      description,
      featured: bestSeller,
      imageUrl,
      images: [imageUrl],
      name,
      price,
      sizes: parseList(sizes),
      slug: `${slugify(name)}-${Date.now()}`,
      stock: stock || 0,
    })

    res.redirect('/admin/products?success=Product%20added')
  } catch (error) {
    next(error)
  }
}

export async function deleteAdminProduct(req, res, next) {
  try {
    const product = await Product.findById(req.params.id)

    if (!product) {
      res.redirect('/admin/products?error=Product%20not%20found')
      return
    }

    product.isActive = false
    await product.save()

    res.redirect('/admin/products?success=Product%20deleted')
  } catch (error) {
    next(error)
  }
}

export async function renderAdminOrders(req, res, next) {
  try {
    const orders = await Order.find({})
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 })

    res.render('admin/orders', {
      title: 'Orders',
      orders,
    })
  } catch (error) {
    next(error)
  }
}
