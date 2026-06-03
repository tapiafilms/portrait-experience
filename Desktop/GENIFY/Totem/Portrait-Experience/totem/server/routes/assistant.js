const express = require('express')
const { assistantTurn, guests } = require('../services/claude')

const router = express.Router()
const conversations = new Map()

// POST /api/assistant/turn
// body: { sessionId, message, history?, guestId? }
router.post('/assistant/turn', async (req, res) => {
  const { sessionId, message, history = [], guestId } = req.body
  if (!sessionId || !message) return res.status(400).json({ error: 'Faltan campos' })

  const guest = guestId ? guests.find(g => g.id === guestId) : null

  try {
    const result = await assistantTurn({ history, userMessage: message, guest })

    const conv = conversations.get(sessionId) || []
    conv.push({ role: 'user', content: message })
    conv.push(result.assistantMessage)
    conversations.set(sessionId, conv)

    res.json({
      speech:  result.speech,
      action:  result.action,
      history: conv,
    })
  } catch (err) {
    console.error('[Assistant]', err.message)
    res.status(500).json({ error: err.message })
  }
})

router.delete('/assistant/:sessionId', (req, res) => {
  conversations.delete(req.params.sessionId)
  res.json({ ok: true })
})

module.exports = router
