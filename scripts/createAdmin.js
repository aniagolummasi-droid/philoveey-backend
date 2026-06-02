import dotenv from 'dotenv'
import connectDB from '../config/db.js'
import User from '../models/User.js'

dotenv.config()

const adminEmail = process.env.ADMIN_EMAIL || 'admin@philoveey.com'
const adminPassword = process.env.ADMIN_PASSWORD || 'Admin12345'
const adminName = process.env.ADMIN_NAME || 'Philoveey Admin'

async function createAdmin() {
  await connectDB()

  let admin = await User.findOne({ email: adminEmail })

  if (admin) {
    admin.name = adminName
    admin.role = 'admin'
    if (adminPassword) admin.password = adminPassword
    await admin.save()
  } else {
    admin = await User.create({
      email: adminEmail,
      name: adminName,
      password: adminPassword,
      role: 'admin',
    })
  }

  console.log(`Admin ready: ${admin.email}`)
  process.exit(0)
}

createAdmin().catch((error) => {
  console.error(error)
  process.exit(1)
})
