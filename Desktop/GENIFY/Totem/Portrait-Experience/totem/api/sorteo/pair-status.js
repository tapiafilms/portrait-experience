const { createClient } = require('@supabase/supabase-js')

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const { sessionId } = req.query
  if (!sessionId) return res.status(400).json({ error: 'sessionId requerido' })

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)

  const { data } = await supabase
    .from('sorteo_participants')
    .select('paired_session_id, paired_selfie_url, confirmed_at')
    .eq('session_id', sessionId)
    .single()

  if (!data) return res.json({ status: 'waiting' })
  if (data.confirmed_at) return res.json({ status: 'confirmed' })
  if (data.paired_session_id) {
    return res.json({
      status: 'paired',
      partner_selfie_url: data.paired_selfie_url,
      partner_session_id: data.paired_session_id,
    })
  }

  res.json({ status: 'waiting' })
}
