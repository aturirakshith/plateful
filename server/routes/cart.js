const express = require('express')
const { getCart, addItem, updateItem, removeItem, mergeCart } = require('../controllers/cartController')
const { authenticate } = require('../middleware/auth')

const router = express.Router()

router.use(authenticate)
router.get('/', getCart)
router.post('/items', addItem)
router.patch('/items/:id', updateItem)
router.delete('/items/:id', removeItem)
router.post('/merge', mergeCart)

module.exports = router
