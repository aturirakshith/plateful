const express = require('express')
const { getMenu, getMenuItem, createMenuItem, updateMenuItem, deleteMenuItem } = require('../controllers/menuController')
const { authenticate, requireAdmin } = require('../middleware/auth')

const router = express.Router()

router.get('/', getMenu)
router.get('/:id', getMenuItem)
router.post('/', authenticate, requireAdmin, createMenuItem)
router.patch('/:id', authenticate, requireAdmin, updateMenuItem)
router.delete('/:id', authenticate, requireAdmin, deleteMenuItem)

module.exports = router
