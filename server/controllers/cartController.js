const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

/**
 * Finds or creates a cart for the authenticated user or guest session.
 * @param {string|null} userId
 * @param {string|null} sessionId
 * @returns {Promise<import('@prisma/client').Cart & { items: import('@prisma/client').CartItem[] }>}
 */
async function findOrCreateCart(userId, sessionId) {
  const where = userId ? { userId } : { sessionId }
  const existing = await prisma.cart.findFirst({ where, include: { items: { include: { menuItem: true } } } })
  if (existing) return existing
  return prisma.cart.create({ data: userId ? { userId } : { sessionId }, include: { items: { include: { menuItem: true } } } })
}

/**
 * Returns the current user's cart with all items and menu item details.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function getCart(req, res, next) {
  try {
    const cart = await findOrCreateCart(req.user.id, req.user.sessionId)
    res.json(cart)
  } catch (err) {
    next(err)
  }
}

/**
 * Adds a menu item to the cart. Increments quantity if item already exists.
 * @param {import('express').Request} req - body: { menuItemId, quantity }
 * @param {import('express').Response} res
 */
async function addItem(req, res, next) {
  try {
    const { menuItemId, quantity = 1 } = req.body
    if (!menuItemId) return res.status(400).json({ message: 'menuItemId is required' })

    const cart = await findOrCreateCart(req.user.id, req.user.sessionId)
    const existing = cart.items.find((i) => i.menuItemId === menuItemId)

    if (existing) {
      await prisma.cartItem.update({ where: { id: existing.id }, data: { quantity: existing.quantity + quantity } })
    } else {
      await prisma.cartItem.create({ data: { cartId: cart.id, menuItemId, quantity } })
    }

    const updated = await prisma.cart.findUnique({ where: { id: cart.id }, include: { items: { include: { menuItem: true } } } })
    res.status(201).json(updated)
  } catch (err) {
    next(err)
  }
}

/**
 * Updates the quantity of a cart item. Removes the item if quantity <= 0.
 * @param {import('express').Request} req - params: { id }, body: { quantity }
 * @param {import('express').Response} res
 */
async function updateItem(req, res, next) {
  try {
    const { quantity } = req.body
    if (quantity === undefined) return res.status(400).json({ message: 'quantity is required' })

    if (quantity <= 0) {
      await prisma.cartItem.delete({ where: { id: req.params.id } })
    } else {
      await prisma.cartItem.update({ where: { id: req.params.id }, data: { quantity } })
    }

    const cart = await findOrCreateCart(req.user.id, req.user.sessionId)
    res.json(cart)
  } catch (err) {
    next(err)
  }
}

/**
 * Removes a specific item from the cart.
 * @param {import('express').Request} req - params: { id }
 * @param {import('express').Response} res
 */
async function removeItem(req, res, next) {
  try {
    await prisma.cartItem.delete({ where: { id: req.params.id } })
    const cart = await findOrCreateCart(req.user.id, req.user.sessionId)
    res.json(cart)
  } catch (err) {
    next(err)
  }
}

/**
 * Merges a guest cart into a user cart after login.
 * Called after a guest logs in or registers; moves all guest cart items to the user cart.
 * @param {import('express').Request} req - body: { sessionId }
 * @param {import('express').Response} res
 */
async function mergeCart(req, res, next) {
  try {
    const { sessionId } = req.body
    if (!sessionId) return res.status(400).json({ message: 'sessionId is required' })

    const guestCart = await prisma.cart.findFirst({ where: { sessionId }, include: { items: true } })
    if (!guestCart) return res.json({ message: 'No guest cart to merge' })

    const userCart = await findOrCreateCart(req.user.id, null)

    for (const item of guestCart.items) {
      const existing = userCart.items?.find((i) => i.menuItemId === item.menuItemId)
      if (existing) {
        await prisma.cartItem.update({ where: { id: existing.id }, data: { quantity: existing.quantity + item.quantity } })
      } else {
        await prisma.cartItem.create({ data: { cartId: userCart.id, menuItemId: item.menuItemId, quantity: item.quantity } })
      }
    }

    await prisma.cart.delete({ where: { id: guestCart.id } })
    const merged = await prisma.cart.findUnique({ where: { id: userCart.id }, include: { items: { include: { menuItem: true } } } })
    res.json(merged)
  } catch (err) {
    next(err)
  }
}

module.exports = { getCart, addItem, updateItem, removeItem, mergeCart }
