const { createClient } = require('@supabase/supabase-js')

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'genofy2025'

function generateKey(eventName) {
  const prefix = eventName
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // quitar tildes
    .toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
  const suffix = Math.random().toString(36).toUpperCase().slice(2, 6)
  return `${prefix}-${suffix}`
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { action, password, eventName, guests, expiresAt, eventId, documentUrl } = req.body

  if (password !== ADMIN_PASSWORD)
    return res.status(401).json({ error: 'Contraseña incorrecta' })

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)

  // Acción: guardar URL del documento en el evento
  if (action === 'update-document') {
    if (!eventId) return res.status(400).json({ error: 'Falta eventId' })
    const { error } = await supabase
      .from('events')
      .update({ document_url: documentUrl || null })
      .eq('id', eventId)
    if (error) return res.status(500).json({ error: error.message })
    return res.json({ ok: true })
  }

  // Acción: verificar contraseña sin crear evento
  if (action === 'auth') {
    return res.json({ ok: true })
  }

  // Acción: crear evento (default)
  if (!eventName || !guests?.length)
    return res.status(400).json({ error: 'Faltan datos del evento' })

  const key = generateKey(eventName)
  const expires = expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

  const { data, error } = await supabase
    .from('events')
    .insert({ key, event_name: eventName, guests, expires_at: expires, active: true })
    .select().single()

  if (error) return res.status(500).json({ error: error.message })

  res.json({ key, eventId: data.id })
}
