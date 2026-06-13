const { Router } = require('express')
const { generateMystery } = require('../services/azureOpenAI.service')

const router = Router()

router.post('/generate', async (req, res) => {
  const { genre, difficulty } = req.body
  if (!genre || !difficulty) {
    return res.status(400).json({ error: 'genre and difficulty are required' })
  }
  const result = await generateMystery(genre, difficulty)
  if (result.error) {
    console.error('[POST /api/mystery/generate] Azure error:', result.message)
    return res.status(500).json(result)
  }
  res.json(result)
})

module.exports = router
