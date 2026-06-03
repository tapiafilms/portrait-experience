const { createClient } = require('@supabase/supabase-js')
const { v4: uuidv4 } = require('uuid')
const QRCode = require('qrcode')
const formidable = require('formidable')
const fs = require('fs')

module.exports.config = { api: { bodyParser: false } }

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)
  const BUCKET = 'portraits'

  const form = formidable({ maxFileSize: 20 * 1024 * 1024 })

  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(400).json({ error: err.message })

    const file = Array.isArray(files.photo) ? files.photo[0] : files.photo
    if (!file) return res.status(400).json({ error: 'No se recibió imagen' })

    try {
      const buffer = await fs.promises.readFile(file.filepath)
      const filename = `original/${uuidv4()}.jpg`

      const { error: uploadError } = await supabase.storage
        .from(BUCKET).upload(filename, buffer, { contentType: 'image/jpeg', upsert: true })
      if (uploadError) throw new Error(uploadError.message)

      const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(filename)

      const qrDataUrl = await QRCode.toDataURL(publicUrl, {
        width: 400, margin: 2,
        color: { dark: '#000000', light: '#ffffff' },
      })

      const { data: session, error: dbError } = await supabase
        .from('sessions').insert({ image_url: publicUrl, filename, qr_data_url: qrDataUrl })
        .select().single()
      if (dbError) throw new Error(dbError.message)

      res.json({
        sessionId: session.id,
        imageUrl: session.image_url,
        qrDataUrl: session.qr_data_url,
        downloadUrl: publicUrl,
      })
    } catch (e) {
      console.error('[capture]', e.message)
      res.status(500).json({ error: e.message })
    }
  })
}
