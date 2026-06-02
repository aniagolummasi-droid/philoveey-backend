import express from 'express'
import {
  createAdminProduct,
  deleteAdminProduct,
  renderAdminDashboard,
  renderAdminOrders,
  renderAdminProducts,
  renderHome,
} from '../controllers/viewController.js'
import { upload } from '../middleware/uploadMiddleware.js'

const router = express.Router()

router.get('/', renderHome)
router.get('/admin', renderAdminDashboard)
router.get('/admin/products', renderAdminProducts)
router.post('/admin/products', upload.single('image'), createAdminProduct)
router.post('/admin/products/:id/delete', deleteAdminProduct)
router.get('/admin/orders', renderAdminOrders)

export default router
