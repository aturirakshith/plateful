const request = require('supertest')
const { app } = require('../index')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()
let adminToken
let testItemId

beforeAll(async () => {
  const bcrypt = require('bcryptjs')
  const jwt = require('jsonwebtoken')
  const admin = await prisma.user.create({
    data: {
      name: 'Admin',
      email: 'admin_menu@test.plateful',
      passwordHash: await bcrypt.hash('admin123', 10),
      role: 'ADMIN',
    },
  })
  adminToken = jwt.sign({ id: admin.id, role: 'ADMIN' }, process.env.JWT_SECRET, { expiresIn: '1h' })
})

afterAll(async () => {
  if (testItemId) await prisma.menuItem.deleteMany({ where: { id: testItemId } })
  await prisma.user.deleteMany({ where: { email: 'admin_menu@test.plateful' } })
  await prisma.$disconnect()
})

describe('GET /api/menu', () => {
  it('returns a list of menu items', async () => {
    const res = await request(app).get('/api/menu')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })
})

describe('POST /api/menu (admin)', () => {
  it('creates a menu item when admin', async () => {
    const res = await request(app)
      .post('/api/menu')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Test Burger', description: 'Tasty', price: 199, category: 'Burgers' })
    expect(res.status).toBe(201)
    expect(res.body.name).toBe('Test Burger')
    testItemId = res.body.id
  })

  it('returns 403 without admin token', async () => {
    const res = await request(app)
      .post('/api/menu')
      .send({ name: 'Hack', description: 'x', price: 1, category: 'x' })
    expect(res.status).toBe(401)
  })

  it('returns 400 if required fields are missing', async () => {
    const res = await request(app)
      .post('/api/menu')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Incomplete' })
    expect(res.status).toBe(400)
  })
})
