require('dotenv').config()
const express = require('express')
const cors = require('cors')
const rateLimit = require('express-rate-limit')

const mysteryRoutes = require('./routes/mystery.routes')
const interrogationRoutes = require('./routes/interrogation.routes')
const accusationRoutes = require('./routes/accusation.routes')
const healthRoutes = require('./routes')

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json())
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }))

app.use('/api', healthRoutes)
app.use('/api/mystery', mysteryRoutes)
app.use('/api/interrogate', interrogationRoutes)
app.use('/api/accusation', accusationRoutes)

app.listen(PORT, () => {
  console.log(`Mysteria AI Backend running on port ${PORT}`)
})

module.exports = app
