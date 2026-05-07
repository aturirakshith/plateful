const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { v4: uuidv4 } = require('uuid')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

/**
 * Signs a JWT access token for the given payload.
 * @param {{ id: string, role: string }} payload
 * @returns {string} signed JWT
 */
function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' })
}

/**
 * Registers a new user with email and password.
 * Returns a JWT on success.
 * @param {import('express').Request} req - body: { name, email, password }
 * @param {import('express').Response} res
 */
async function register(req, res, next) {
  try {
    const { name, email, password } = req.body
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'name, email and password are required' })
    }
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) return res.status(409).json({ message: 'Email already in use' })

    const passwordHash = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: { name, email, passwordHash, role: 'USER' },
    })
    const token = signToken({ id: user.id, role: user.role })
    res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } })
  } catch (err) {
    next(err)
  }
}

/**
 * Authenticates an existing user with email and password.
 * Returns a JWT on success.
 * @param {import('express').Request} req - body: { email, password }
 * @param {import('express').Response} res
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ message: 'email and password are required' })
    }
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !user.passwordHash) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }
    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' })

    const token = signToken({ id: user.id, role: user.role })
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } })
  } catch (err) {
    next(err)
  }
}

/**
 * Creates a guest session token with a unique sessionId.
 * Guest carts are stored by sessionId and can be merged on login.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function guest(req, res, next) {
  try {
    const sessionId = uuidv4()
    const user = await prisma.user.create({
      data: { name: 'Guest', email: `guest_${sessionId}@plateful.local`, role: 'GUEST', sessionId },
    })
    const token = signToken({ id: user.id, role: user.role, sessionId })
    res.status(201).json({ token, sessionId })
  } catch (err) {
    next(err)
  }
}

/**
 * Returns the currently authenticated user's profile.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function me(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, role: true },
    })
    if (!user) return res.status(404).json({ message: 'User not found' })
    res.json(user)
  } catch (err) {
    next(err)
  }
}

module.exports = { register, login, guest, me }
