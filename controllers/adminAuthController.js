import User from '../models/User.js'
import generateToken from '../utils/generateToken.js'

function userResponse(user) {
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    address: user.address,
    token: generateToken(user._id),
  }
}

export async function registerAdmin(req, res, next) {
  try {
    const { name, email, password } = req.body

    if (!email || !password) {
      res.status(400)
      throw new Error('Email and password are required')
    }

    // Gate admin registration via environment credentials
    if (email !== process.env.ADMIN_EMAIL || password !== process.env.ADMIN_PASSWORD) {
      res.status(403)
      throw new Error('Not allowed to register admin')
    }

    let admin = await User.findOne({ email })

    if (admin) {
      admin.name = name || admin.name
      admin.role = 'admin'
      if (password) admin.password = password
      await admin.save()
      return res.json(userResponse(admin))
    }

    admin = await User.create({ email, name: name || 'Admin', password, role: 'admin' })

    res.status(201).json(userResponse(admin))
  } catch (error) {
    next(error)
  }
}

export async function loginAdmin(req, res, next) {
  try {
    const { email, password } = req.body

    if (
      email !== process.env.ADMIN_EMAIL ||
      password !== process.env.ADMIN_PASSWORD
    ) {
      res.status(401)
      throw new Error('Invalid admin credentials')
    }

    let admin = await User.findOne({ email })

    if (!admin) {
      admin = await User.create({
        email,
        name: process.env.ADMIN_NAME || 'Admin',
        password,
        role: 'admin',
      })
    } else {
      let didUpdate = false

      if (admin.role !== 'admin') {
        admin.role = 'admin'
        didUpdate = true
      }

      if (admin.name !== process.env.ADMIN_NAME) {
        admin.name = process.env.ADMIN_NAME || admin.name
        didUpdate = true
      }

      if (!(await admin.matchPassword(password))) {
        admin.password = password
        didUpdate = true
      }

      if (didUpdate) {
        await admin.save()
      }
    }

    res.json(userResponse(admin))
  } catch (error) {
    next(error)
  }
}
