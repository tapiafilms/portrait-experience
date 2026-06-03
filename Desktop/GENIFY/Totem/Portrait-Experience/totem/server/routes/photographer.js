const express = require('express')
const { photographerTurn } = require('../services/claude')

const router = express.Router()

// Historial de conversación por sesión (en memoria para MVP)
const conversations = new Map()

// POST /api/photographer/turn
// body: { sessionId, message, history? }
router.post('/photographer/turn', async (req, res) => {
  const { sessionId, message, history = [] } = req.body
  if (!sessionId || !message) return res.status(400).json({ error: 'Faltan campos' })

  try {
    const result = await photographerTurn({ history, userMessage: message })

    // Guardar turno en historial
    const conv = conversations.get(sessionId) || []
    conv.push({ role: 'user', content: message })
    conv.push(result.assistantMessage)
    conversations.set(sessionId, conv)

    res.json({
      speech:    result.speech,
      action:    result.action,
      guestId:   result.guestId,
      guestData: result.guestData,
      history:   conv,
    })
  } catch (err) {
    console.error('[Photographer]', err.message)
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/photographer/:sessionId — limpiar historial
router.delete('/photographer/:sessionId', (req, res) => {
  conversations.delete(req.params.sessionId)
  res.json({ ok: true })
})

module.exports = router
