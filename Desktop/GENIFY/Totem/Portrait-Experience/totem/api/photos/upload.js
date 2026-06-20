const { createClient } = require('@supabase/supabase-js')
const Anthropic = require('@anthropic-ai/sdk')
const { v4: uuidv4 } = require('uuid')

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { photo, eventId } = req.body
  if (!photo || !eventId) return res.status(400).json({ error: 'Faltan datos' })

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  )

  try {
    // 1. Subir foto a Supabase Storage
    const base64Data = photo.replace(/^data:image\/\w+;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')
    const filename = `event-photos/${eventId}/${uuidv4()}.jpg`

    const { error: uploadError } = await supabase.storage
      .from('portraits').upload(filename, buffer, { contentType: 'image/jpeg', upsert: true })
    if (uploadError) throw new Error(uploadError.message)

    const { data: { publicUrl } } = supabase.storage.from('portraits').getPublicUrl(filename)

    // 2. Guardar en DB inmediatamente como approved
    const { data: eventPhoto } = await supabase
      .from('event_photos')
      .insert({ event_id: eventId, photo_url: publicUrl, status: 'approved' })
      .select().single()

    // 3. Responder al usuario al instante
    res.json({ ok: true, status: 'approved', photoUrl: publicUrl, id: eventPhoto?.id })

    // 4. Moderación asíncrona en segundo plano
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 50,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: 'image/jpeg', data: base64Data.slice(0, 500000) },
          },
          {
            type: 'text',
            text: 'Esta foto será proyectada en una pantalla grande en un evento. Rechaza SOLO si contiene contenido explícito, violento u ofensivo. En cualquier otro caso responde APPROVED.',
          },
        ],
      }],
    }).then(moderation => {
      const verdict = moderation.content[0]?.text?.trim().toUpperCase()
      if (verdict !== 'APPROVED') {
        // Eliminar foto de storage y DB silenciosamente
        supabase.storage.from('portraits').remove([filename]).catch(() => {})
        if (eventPhoto?.id) {
          supabase.from('event_photos').delete().eq('id', eventPhoto.id).catch(() => {})
        }
      }
    }).catch(() => {})
  } catch (err) {
    console.error('[photos/upload]', err.message)
    res.status(500).json({ error: err.message })
  }
}
