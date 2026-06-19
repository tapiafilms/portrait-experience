const { createClient } = require('@supabase/supabase-js')

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'genofy2025'

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { eventId, password, seconds = 5 } = req.body
  if (!eventId) return res.status(400).json({ error: 'eventId requerido' })
  if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Contraseña incorrecta' })

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)

  const now = new Date().toISOString()
  await supabase.from('sorteo_events').upsert(
    { event_id: eventId, state: 'countdown', countdown_start_at: now, countdown_seconds: seconds, updated_at: now },
    { onConflict: 'event_id' }
  )

  res.json({ ok: true, state: 'countdown', countdown_start_at: now, countdown_seconds: seconds })
}
