const express = require('express')
const { verifyPayment } = require('../controllers/orderController')
const { authenticate } = require('../middleware/auth')

const router = express.Router()

router.post('/verify', authenticate, verifyPayment)

module.exports = router
