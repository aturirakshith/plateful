const Razorpay = require('razorpay')
const crypto = require('crypto')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
})

/**
 * Creates a new order from the user's cart and a corresponding Razorpay order.
 * Cart is NOT cleared here — it is cleared after successful payment verification.
 * @param {import('express').Request} req - body: { address }
 * @param {import('express').Response} res
 */
async function createOrder(req, res, next) {
  try {
    const { address } = req.body
    if (!address) return res.status(400).json({ message: 'address is required' })

    const cart = await prisma.cart.findFirst({
      where: req.user.id ? { userId: req.user.id } : { sessionId: req.user.sessionId },
      include: { items: { include: { menuItem: true } } },
    })

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' })
    }

    const totalAmount = cart.items.reduce((sum, i) => sum + i.menuItem.price * i.quantity, 0)

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(totalAmount * 100),
      currency: 'INR',
      receipt: `plateful_${Date.now()}`,
    })

    const order = await prisma.order.create({
      data: {
        userId: req.user.role !== 'GUEST' ? req.user.id : undefined,
        sessionId: req.user.role === 'GUEST' ? req.user.sessionId : undefined,
        totalAmount,
        address,
        razorpayOrderId: razorpayOrder.id,
        items: {
          create: cart.items.map((i) => ({
            menuItemId: i.menuItemId,
            quantity: i.quantity,
            price: i.menuItem.price,
          })),
        },
      },
      include: { items: { include: { menuItem: true } } },
    })

    res.status(201).json({ order, razorpayOrderId: razorpayOrder.id, amount: razorpayOrder.amount, currency: razorpayOrder.currency })
  } catch (err) {
    next(err)
  }
}

/**
 * Verifies the Razorpay payment HMAC signature.
 * On success: marks order CONFIRMED and clears the cart.
 * On failure: marks order FAILED.
 * @param {import('express').Request} req - body: { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId }
 * @param {import('express').Response} res
 */
async function verifyPayment(req, res, next) {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId } = req.body

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex')

    if (expectedSignature !== razorpaySignature) {
      await prisma.order.update({ where: { id: orderId }, data: { status: 'FAILED' } })
      return res.status(400).json({ message: 'Payment verification failed' })
    }

    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status: 'CONFIRMED', paymentId: razorpayPaymentId },
    })

    await prisma.cartItem.deleteMany({
      where: {
        cart: req.user.role !== 'GUEST' ? { userId: req.user.id } : { sessionId: req.user.sessionId },
      },
    })

    res.json({ message: 'Payment verified', order })
  } catch (err) {
    next(err)
  }
}

/**
 * Returns a specific order by ID. Users can only view their own orders.
 * @param {import('express').Request} req - params: { id }
 * @param {import('express').Response} res
 */
async function getOrder(req, res, next) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { items: { include: { menuItem: true } } },
    })
    if (!order) return res.status(404).json({ message: 'Order not found' })

    const isOwner = order.userId === req.user.id || order.sessionId === req.user.sessionId
    if (!isOwner && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied' })
    }

    res.json(order)
  } catch (err) {
    next(err)
  }
}

/**
 * Returns all orders belonging to the current user.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function getMyOrders(req, res, next) {
  try {
    const orders = await prisma.order.findMany({
      where: req.user.role !== 'GUEST' ? { userId: req.user.id } : { sessionId: req.user.sessionId },
      include: { items: { include: { menuItem: true } } },
      orderBy: { createdAt: 'desc' },
    })
    res.json(orders)
  } catch (err) {
    next(err)
  }
}

/**
 * Updates an order's status. Admin only.
 * Emits a socket.io event to the order's room so clients receive live updates.
 * @param {import('express').Request} req - params: { id }, body: { status }
 * @param {import('express').Response} res
 */
async function updateOrderStatus(req, res, next) {
  try {
    const { status } = req.body
    const validStatuses = ['PENDING', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED']
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' })
    }

    const order = await prisma.order.update({ where: { id: req.params.id }, data: { status } })

    const io = req.app.locals.io
    io.to(`order:${order.id}`).emit('order:status_update', { orderId: order.id, status: order.status })

    res.json(order)
  } catch (err) {
    next(err)
  }
}

module.exports = { createOrder, verifyPayment, getOrder, getMyOrders, updateOrderStatus }
