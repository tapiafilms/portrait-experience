const express = require('express')
const multer = require('multer')
const { v4: uuidv4 } = require('uuid')
const QRCode = require('qrcode')
const { uploadImage, saveSession } = require('../services/supabase')

const router = express.Router()

// Multer en memoria — no guarda en disco
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } })

router.post('/capture', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No se recibió imagen' })

    const filename = `original/${uuidv4()}.jpg`

    // Subir imagen original a Supabase Storage
    const imageUrl = await uploadImage(req.file.buffer, filename, req.file.mimetype)

    // Generar QR apuntando a la imagen directamente
    const qrDataUrl = await QRCode.toDataURL(imageUrl, {
      width: 400, margin: 2,
      color: { dark: '#000000', light: '#ffffff' },
    })

    // Guardar sesión en Supabase DB
    const session = await saveSession({
      image_url: imageUrl,
      filename,
      qr_data_url: qrDataUrl,
    })

    res.json({
      sessionId: session.id,
      imageUrl: session.image_url,
      qrDataUrl: session.qr_data_url,
      downloadUrl: imageUrl,
    })
  } catch (err) {
    console.error('[Capture]', err.message)
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
