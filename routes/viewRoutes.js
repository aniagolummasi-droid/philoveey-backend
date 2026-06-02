import express from 'express'
import {
  createAdminProduct,
  deleteAdminProduct,
  handleAdminLogin,
  handleAdminRegister,
  renderAdminDashboard,
  renderAdminLogin,
  renderAdminOrders,
  renderAdminProducts,
  renderAdminRegister,
  renderHome,
} from '../controllers/viewController.js'
import { upload } from '../middleware/uploadMiddleware.js'

const router = express.Router()

router.get('/', renderHome)
router.get('/admin', renderAdminDashboard)
router.get('/admin/login', renderAdminLogin)
router.post('/admin/login', handleAdminLogin)
router.get('/admin/register', renderAdminRegister)
router.post('/admin/register', handleAdminRegister)
router.get('/admin/products', renderAdminProducts)
router.post('/admin/products', upload.single('image'), createAdminProduct)
router.post('/admin/products/:id/delete', deleteAdminProduct)
router.get('/admin/orders', renderAdminOrders)

export default router
