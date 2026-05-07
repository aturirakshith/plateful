require('dotenv').config()
const express = require('express')
const cors = require('cors')
const http = require('http')
const { Server } = require('socket.io')

const authRoutes = require('./routes/auth')
const menuRoutes = require('./routes/menu')
const cartRoutes = require('./routes/cart')
const orderRoutes = require('./routes/orders')
const paymentRoutes = require('./routes/payment')

const app = express()
const httpServer = http.createServer(app)

/** Socket.io instance shared across controllers via app.locals */
const io = new Server(httpServer, {
  cors: { origin: process.env.CLIENT_URL, methods: ['GET', 'POST'] },
})

app.locals.io = io

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }))
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/menu', menuRoutes)
app.use('/api/cart', cartRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/payment', paymentRoutes)

/** Global error handler */
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' })
})

io.on('connection', (socket) => {
  /** Join a room scoped to a specific order for real-time tracking */
  socket.on('join:order', (orderId) => {
    socket.join(`order:${orderId}`)
  })
})

const PORT = process.env.PORT || 4000
httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`))

module.exports = { app, httpServer }
