const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

/**
 * Finds or creates a cart for the given userId.
 * All users (including guests) have a real userId since the guest
 * endpoint creates a DB record, so we always key carts by userId.
 * @param {string} userId
 * @returns {Promise<import('@prisma/client').Cart & { items: import('@prisma/client').CartItem[] }>}
 */
async function findOrCreateCart(userId) {
  const existing = await prisma.cart.findFirst({
    where: { userId },
    include: { items: { include: { menuItem: true } } },
  })
  if (existing) return existing
  return prisma.cart.create({
    data: { userId },
    include: { items: { include: { menuItem: true } } },
  })
}

/**
 * Returns the current user's cart with all items and menu item details.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function getCart(req, res, next) {
  try {
    const cart = await findOrCreateCart(req.user.id)
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

    const cart = await findOrCreateCart(req.user.id)
    const existing = cart.items.find((i) => i.menuItemId === menuItemId)

    if (existing) {
      await prisma.cartItem.update({ where: { id: existing.id }, data: { quantity: existing.quantity + quantity } })
    } else {
      await prisma.cartItem.create({ data: { cartId: cart.id, menuItemId, quantity } })
    }

    const updated = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: { items: { include: { menuItem: true } } },
    })
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

    const cart = await findOrCreateCart(req.user.id)
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
    const cart = await findOrCreateCart(req.user.id)
    res.json(cart)
  } catch (err) {
    next(err)
  }
}

/**
 * Merges a guest cart into the logged-in user's cart after login/register.
 * Looks up the guest user by sessionId, finds their cart by userId,
 * then moves all items into the real user's cart.
 * @param {import('express').Request} req - body: { sessionId }
 * @param {import('express').Response} res
 */
async function mergeCart(req, res, next) {
  try {
    const { sessionId } = req.body
    if (!sessionId) return res.status(400).json({ message: 'sessionId is required' })

    // Find the guest user record by sessionId, then find their cart by userId
    const guestUser = await prisma.user.findUnique({ where: { sessionId } })
    if (!guestUser) return res.json({ message: 'No guest session to merge', items: [] })

    const guestCart = await prisma.cart.findFirst({
      where: { userId: guestUser.id },
      include: { items: true },
    })
    if (!guestCart || guestCart.items.length === 0) {
      return res.json({ message: 'No guest cart to merge', items: [] })
    }

    const userCart = await findOrCreateCart(req.user.id)

    for (const item of guestCart.items) {
      const existing = userCart.items.find((i) => i.menuItemId === item.menuItemId)
      if (existing) {
        await prisma.cartItem.update({
          where: { id: existing.id },
          data: { quantity: existing.quantity + item.quantity },
        })
      } else {
        await prisma.cartItem.create({
          data: { cartId: userCart.id, menuItemId: item.menuItemId, quantity: item.quantity },
        })
      }
    }

    // Delete the guest cart and guest user record to keep DB clean
    await prisma.cart.delete({ where: { id: guestCart.id } })
    await prisma.user.delete({ where: { id: guestUser.id } })

    const merged = await prisma.cart.findUnique({
      where: { id: userCart.id },
      include: { items: { include: { menuItem: true } } },
    })
    res.json(merged)
  } catch (err) {
    next(err)
  }
}

module.exports = { getCart, addItem, updateItem, removeItem, mergeCart, findOrCreateCart }
