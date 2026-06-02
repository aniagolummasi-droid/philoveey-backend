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

export async function registerUser(req, res, next) {
  try {
    const { name, email, password, phone } = req.body

    if (!name || !email || !password) {
      res.status(400)
      throw new Error('Name, email, and password are required')
    }

    const userExists = await User.findOne({ email })

    if (userExists) {
      res.status(409)
      throw new Error('User already exists')
    }

    const user = await User.create({ name, email, password, phone })

    res.status(201).json(userResponse(user))
  } catch (error) {
    next(error)
  }
}

export async function loginUser(req, res, next) {
  try {
    const { email, password } = req.body
    const user = await User.findOne({ email })

    if (!user || !(await user.matchPassword(password))) {
      res.status(401)
      throw new Error('Invalid email or password')
    }

    res.json(userResponse(user))
  } catch (error) {
    next(error)
  }
}

export async function getProfile(req, res) {
  res.json(req.user)
}

export async function updateProfile(req, res, next) {
  try {
    const user = await User.findById(req.user._id)

    if (!user) {
      res.status(404)
      throw new Error('User not found')
    }

    user.name = req.body.name ?? user.name
    user.email = req.body.email ?? user.email
    user.phone = req.body.phone ?? user.phone
    user.address = req.body.address ?? user.address

    if (req.body.password) user.password = req.body.password

    const updatedUser = await user.save()

    res.json(userResponse(updatedUser))
  } catch (error) {
    next(error)
  }
}
