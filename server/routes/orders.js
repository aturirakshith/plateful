const express = require('express')
const { createOrder, getOrder, getMyOrders, updateOrderStatus } = require('../controllers/orderController')
const { authenticate, requireAdmin } = require('../middleware/auth')

const router = express.Router()

router.use(authenticate)
router.post('/', createOrder)
router.get('/my', getMyOrders)
router.get('/:id', getOrder)
router.patch('/:id/status', requireAdmin, updateOrderStatus)

module.exports = router
