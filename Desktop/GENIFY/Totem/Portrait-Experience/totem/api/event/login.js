const { createClient } = require('@supabase/supabase-js')

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { key } = req.body
  if (!key) return res.status(400).json({ error: 'Falta la clave' })

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)

  const { data: event } = await supabase
    .from('events')
    .select('id, key, event_name, guests, expires_at, active')
    .eq('key', key.trim().toUpperCase())
    .single()

  if (!event) return res.status(401).json({ error: 'Clave inválida' })
  if (!event.active) return res.status(401).json({ error: 'Evento inactivo' })
  if (new Date(event.expires_at) < new Date()) return res.status(401).json({ error: 'Clave expirada' })

  res.json({
    eventId:   event.id,
    eventName: event.event_name,
    guests:    event.guests,
  })
}
