import path from 'path'
import { fileURLToPath } from 'url'
import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import morgan from 'morgan'
import connectDB from './config/db.js'
import { errorHandler, notFound } from './middleware/errorMiddleware.js'
import authRoutes from './routes/authRoutes.js'
import adminAuthRoutes from './routes/adminAuthRoutes.js'
import cartRoutes from './routes/cartRoutes.js'
import orderRoutes from './routes/orderRoutes.js'
import paymentRoutes from './routes/paymentRoutes.js'
import productRoutes from './routes/productRoutes.js'
import viewRoutes from './routes/viewRoutes.js'

dotenv.config()

connectDB()

const app = express()
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const port = process.env.PORT || 5000
const productionOrigins = [
  'https://philoveey.vercel.app',
  'https://philoveeystore.com.ng',
  'https://www.philoveeystore.com.ng',
  'https://philoveey-backend.onrender.com',
]
const allowedOrigins = [
  process.env.CLIENT_URL,
  ...productionOrigins,
  `http://localhost:${port}`,
  `http://127.0.0.1:${port}`,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
]
  .flatMap((origin) => (origin ? origin.split(',') : []))
  .map((origin) => origin.trim())
  .filter(Boolean)

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true)
        return
      }

      callback(new Error(`CORS blocked origin: ${origin}`))
    },
    credentials: true,
  }),
)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))
app.use(express.static(path.join(__dirname, 'public')))

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'))
}

app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() })
})

app.use('/', viewRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/admin', adminAuthRoutes)
app.use('/api/cart', cartRoutes)
app.use('/api/products', productRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/payments', paymentRoutes)

app.use(notFound)
app.use(errorHandler)

app.listen(port, () => {
  console.log(`Server running on port ${port}`)
})
