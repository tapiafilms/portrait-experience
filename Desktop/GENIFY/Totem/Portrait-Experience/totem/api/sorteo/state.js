const { createClient } = require('@supabase/supabase-js')

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const { eventId } = req.query
  if (!eventId) return res.status(400).json({ error: 'eventId requerido' })

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)

  const { data } = await supabase
    .from('sorteo_events')
    .select('state, countdown_start_at, countdown_seconds')
    .eq('event_id', eventId)
    .single()

  if (!data) return res.json({ state: 'inactive', countdown_start_at: null, countdown_seconds: 5 })

  res.json(data)
}
