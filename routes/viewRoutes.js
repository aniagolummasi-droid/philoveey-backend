import express from 'express'
import {
  createAdminProduct,
  deleteAdminProduct,
  handleAdminLogin,
  handleAdminLogout,
  handleAdminRegister,
  renderAdminDashboard,
  renderAdminLogin,
  renderAdminOrders,
  renderAdminProducts,
  renderAdminRegister,
  renderHome,
} from '../controllers/viewController.js'
import { upload } from '../middleware/uploadMiddleware.js'
import { requireAdminAuth } from '../middleware/adminAuthMiddleware.js'

const router = express.Router()

router.get('/', renderHome)
router.get('/admin/login', renderAdminLogin)
router.post('/admin/login', handleAdminLogin)
router.get('/admin/register', renderAdminRegister)
router.post('/admin/register', handleAdminRegister)
router.get('/admin/logout', handleAdminLogout)

router.get('/admin', requireAdminAuth, renderAdminDashboard)
router.get('/admin/products', requireAdminAuth, renderAdminProducts)
router.post('/admin/products', requireAdminAuth, upload.single('image'), createAdminProduct)
router.post('/admin/products/:id/delete', requireAdminAuth, deleteAdminProduct)
router.get('/admin/orders', requireAdminAuth, renderAdminOrders)

export default router
