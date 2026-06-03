const express = require('express')
const { getSession } = require('../services/supabase')

const router = express.Router()

router.get('/session/:id', async (req, res) => {
  const session = await getSession(req.params.id)
  if (!session) return res.status(404).json({ error: 'Sesión no encontrada' })
  res.json(session)
})

// El QR apunta directo a la imagen en Supabase Storage — no necesitamos download route
router.get('/session/:id/download', async (req, res) => {
  const session = await getSession(req.params.id)
  if (!session) return res.status(404).send('Sesión no encontrada')
  res.redirect(session.transformed_url || session.image_url)
})

module.exports = router
