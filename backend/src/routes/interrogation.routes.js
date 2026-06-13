const { Router } = require('express')
const { interrogateSuspect } = require('../services/azureOpenAI.service')

const router = Router()

router.post('/', async (req, res) => {
  const { suspect, conversationHistory, playerMessage, victim } = req.body
  if (!suspect || !playerMessage || !victim) {
    return res.status(400).json({ error: 'suspect, playerMessage and victim are required' })
  }
  const result = await interrogateSuspect(suspect, conversationHistory || [], playerMessage, victim)
  if (result.error) {
    return res.status(500).json(result)
  }
  res.json(result)
})

module.exports = router
