const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

/**
 * Returns all available menu items, optionally filtered by category.
 * @param {import('express').Request} req - query: { category }
 * @param {import('express').Response} res
 */
async function getMenu(req, res, next) {
  try {
    const { category } = req.query
    const items = await prisma.menuItem.findMany({
      where: { available: true, ...(category ? { category } : {}) },
      orderBy: { category: 'asc' },
    })
    res.json(items)
  } catch (err) {
    next(err)
  }
}

/**
 * Returns a single menu item by ID.
 * @param {import('express').Request} req - params: { id }
 * @param {import('express').Response} res
 */
async function getMenuItem(req, res, next) {
  try {
    const item = await prisma.menuItem.findUnique({ where: { id: req.params.id } })
    if (!item) return res.status(404).json({ message: 'Item not found' })
    res.json(item)
  } catch (err) {
    next(err)
  }
}

/**
 * Creates a new menu item. Admin only.
 * @param {import('express').Request} req - body: { name, description, price, category, imageUrl }
 * @param {import('express').Response} res
 */
async function createMenuItem(req, res, next) {
  try {
    const { name, description, price, category, imageUrl } = req.body
    if (!name || !description || !price || !category) {
      return res.status(400).json({ message: 'name, description, price and category are required' })
    }
    const item = await prisma.menuItem.create({ data: { name, description, price, category, imageUrl } })
    res.status(201).json(item)
  } catch (err) {
    next(err)
  }
}

/**
 * Updates an existing menu item by ID. Admin only.
 * @param {import('express').Request} req - params: { id }, body: partial MenuItem fields
 * @param {import('express').Response} res
 */
async function updateMenuItem(req, res, next) {
  try {
    const { name, description, price, category, imageUrl, available } = req.body
    const item = await prisma.menuItem.update({
      where: { id: req.params.id },
      data: { name, description, price, category, imageUrl, available },
    })
    res.json(item)
  } catch (err) {
    next(err)
  }
}

/**
 * Deletes a menu item by ID. Admin only.
 * @param {import('express').Request} req - params: { id }
 * @param {import('express').Response} res
 */
async function deleteMenuItem(req, res, next) {
  try {
    await prisma.menuItem.delete({ where: { id: req.params.id } })
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}

module.exports = { getMenu, getMenuItem, createMenuItem, updateMenuItem, deleteMenuItem }
