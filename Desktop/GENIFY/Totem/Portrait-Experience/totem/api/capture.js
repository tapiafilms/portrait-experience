const { createClient } = require('@supabase/supabase-js')
const { v4: uuidv4 } = require('uuid')
const QRCode = require('qrcode')

const BASE_URL = process.env.APP_URL || 'https://portrait-experience.vercel.app'

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)
  const BUCKET = 'portraits'

  try {
    const { photo } = req.body
    if (!photo) return res.status(400).json({ error: 'No se recibió imagen' })

    const buffer = Buffer.from(photo.replace(/^data:image\/\w+;base64,/, ''), 'base64')
    const filename = `original/${uuidv4()}.jpg`

    // Subir imagen a Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(BUCKET).upload(filename, buffer, { contentType: 'image/jpeg', upsert: true })
    if (uploadError) throw new Error(`Storage: ${uploadError.message}`)

    const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(filename)

    // Guardar sesión para obtener el ID
    const { eventId } = req.body

    const { data: session, error: dbError } = await supabase
      .from('sessions').insert({ image_url: publicUrl, filename, qr_data_url: '', event_id: eventId || null })
      .select().single()
    if (dbError) throw new Error(`DB: ${dbError.message}`)

    // QR apunta al endpoint que siempre redirige a la mejor foto (transformada > original)
    const redirectUrl = `${BASE_URL}/session/${session.id}`
    const qrDataUrl = await QRCode.toDataURL(redirectUrl, {
      width: 400, margin: 2,
      color: { dark: '#000000', light: '#ffffff' },
    })

    // Actualizar QR en la sesión
    await supabase.from('sessions').update({ qr_data_url: qrDataUrl }).eq('id', session.id)

    res.json({
      sessionId: session.id,
      imageUrl: publicUrl,
      qrDataUrl,
      downloadUrl: redirectUrl,
    })
  } catch (e) {
    console.error('[capture]', e.message)
    res.status(500).json({ error: e.message })
  }
}
