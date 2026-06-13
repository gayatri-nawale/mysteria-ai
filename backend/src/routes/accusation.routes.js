const { Router } = require('express')
const { evaluateAccusation } = require('../services/azureOpenAI.service')

const router = Router()

router.post('/submit', async (req, res) => {
  const { mystery, accusedSuspectId, playerReasoning } = req.body
  if (!mystery || !accusedSuspectId || !playerReasoning) {
    return res.status(400).json({ error: 'mystery, accusedSuspectId and playerReasoning are required' })
  }
  const result = await evaluateAccusation(mystery, accusedSuspectId, playerReasoning)
  if (result.error) {
    return res.status(500).json(result)
  }
  res.json(result)
})

module.exports = router
