import express from 'express'
import {
  handlePaystackWebhook,
  initializePayment,
  verifyPayment,
} from '../controllers/paymentController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = express.Router()

router.post(
  '/webhook/paystack',
  express.raw({ type: 'application/json' }),
  handlePaystackWebhook,
)
router.post('/initialize/:orderId', protect, initializePayment)
router.get('/verify/:reference', protect, verifyPayment)

export default router
