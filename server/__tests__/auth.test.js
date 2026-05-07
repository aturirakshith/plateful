const request = require('supertest')
const { app } = require('../index')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { contains: '@test.plateful' } } })
  await prisma.$disconnect()
})

describe('POST /api/auth/register', () => {
  it('registers a new user and returns a token', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Test User',
      email: 'test_register@test.plateful',
      password: 'password123',
    })
    expect(res.status).toBe(201)
    expect(res.body.token).toBeDefined()
    expect(res.body.user.email).toBe('test_register@test.plateful')
  })

  it('returns 409 if email already in use', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'Dup User',
      email: 'test_dup@test.plateful',
      password: 'password123',
    })
    const res = await request(app).post('/api/auth/register').send({
      name: 'Dup User',
      email: 'test_dup@test.plateful',
      password: 'password123',
    })
    expect(res.status).toBe(409)
  })

  it('returns 400 if fields are missing', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'nope@test.plateful' })
    expect(res.status).toBe(400)
  })
})

describe('POST /api/auth/login', () => {
  beforeAll(async () => {
    await request(app).post('/api/auth/register').send({
      name: 'Login User',
      email: 'test_login@test.plateful',
      password: 'secret123',
    })
  })

  it('logs in with valid credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'test_login@test.plateful',
      password: 'secret123',
    })
    expect(res.status).toBe(200)
    expect(res.body.token).toBeDefined()
  })

  it('returns 401 with wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'test_login@test.plateful',
      password: 'wrong',
    })
    expect(res.status).toBe(401)
  })

  it('returns 400 if fields are missing', async () => {
    const res = await request(app).post('/api/auth/login').send({})
    expect(res.status).toBe(400)
  })
})

describe('POST /api/auth/guest', () => {
  it('creates a guest session and returns a token', async () => {
    const res = await request(app).post('/api/auth/guest')
    expect(res.status).toBe(201)
    expect(res.body.token).toBeDefined()
    expect(res.body.sessionId).toBeDefined()
  })
})

describe('GET /api/auth/me', () => {
  it('returns user profile with valid token', async () => {
    const reg = await request(app).post('/api/auth/register').send({
      name: 'Me User',
      email: 'test_me@test.plateful',
      password: 'pass123',
    })
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${reg.body.token}`)
    expect(res.status).toBe(200)
    expect(res.body.email).toBe('test_me@test.plateful')
  })

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/auth/me')
    expect(res.status).toBe(401)
  })
})
