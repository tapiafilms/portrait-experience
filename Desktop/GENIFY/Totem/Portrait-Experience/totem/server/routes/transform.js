const express = require('express')
const { v4: uuidv4 } = require('uuid')
const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args))
const { transformImage, transformImageDemo } = require('../services/falai')
const { prepareForAIBuffer, addWatermarkBuffer } = require('../services/imageProcessor')
const { uploadImage, updateSession, getSession } = require('../services/supabase')

const router = express.Router()

router.post('/transform/:sessionId', async (req, res) => {
  const session = await getSession(req.params.sessionId)
  if (!session) return res.status(404).json({ error: 'Sesión no encontrada' })

  try {
    // Descargar imagen original desde Supabase Storage
    const imgRes = await fetch(session.image_url)
    if (!imgRes.ok) throw new Error('No se pudo descargar la imagen original')
    const originalBuffer = Buffer.from(await imgRes.arrayBuffer())

    // Preparar para IA
    const preparedBuffer = await prepareForAIBuffer(originalBuffer)

    const hasKey = !!process.env.FAL_API_KEY
    let resultUrl

    if (hasKey) {
      console.log('\n[Transform] Iniciando transformación IA...')
      resultUrl = await transformImage({ imageBuffer: preparedBuffer })
    } else {
      console.log('[Transform] Demo mode — sin FAL_API_KEY')
      resultUrl = await transformImageDemo(preparedBuffer)
    }

    // Obtener buffer del resultado
    let transformedBuffer
    if (resultUrl.startsWith('http')) {
      const r = await fetch(resultUrl)
      if (!r.ok) throw new Error(`Error descargando resultado: ${r.status}`)
      transformedBuffer = Buffer.from(await r.arrayBuffer())
    } else {
      const base64 = resultUrl.replace(/^data:image\/\w+;base64,/, '')
      transformedBuffer = Buffer.from(base64, 'base64')
    }

    // Agregar watermark
    const finalBuffer = await addWatermarkBuffer(transformedBuffer)

    // Subir resultado a Supabase Storage
    const finalFilename = `transformed/${uuidv4()}.jpg`
    const transformedImageUrl = await uploadImage(finalBuffer, finalFilename)

    // Actualizar sesión
    await updateSession(session.id, { transformed_url: transformedImageUrl })

    res.json({
      sessionId: session.id,
      originalImageUrl: session.image_url,
      transformedImageUrl,
      demoMode: !hasKey,
    })
  } catch (err) {
    console.error('[Transform]', err.message)
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
