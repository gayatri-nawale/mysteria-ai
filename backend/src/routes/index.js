const { Router } = require('express')

const router = Router()

router.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Mysteria AI Backend Running', timestamp: new Date().toISOString() })
})

module.exports = router
