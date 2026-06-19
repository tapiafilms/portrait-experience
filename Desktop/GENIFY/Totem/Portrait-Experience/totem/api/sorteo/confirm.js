const { createClient } = require('@supabase/supabase-js')

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { scannerSessionId, scannedSessionId } = req.body
  if (!scannerSessionId || !scannedSessionId) return res.status(400).json({ error: 'Faltan datos' })

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)

  // Verificar que realmente están emparejados
  const { data: scanner } = await supabase
    .from('sorteo_participants')
    .select('paired_session_id, confirmed_at')
    .eq('session_id', scannerSessionId)
    .single()

  if (!scanner) return res.status(404).json({ error: 'Participante no encontrado' })
  if (scanner.paired_session_id !== scannedSessionId) return res.status(400).json({ error: 'No son pareja' })
  if (scanner.confirmed_at) return res.json({ ok: true, already: true })

  const now = new Date().toISOString()

  // Marcar ambos como confirmados
  await supabase.from('sorteo_participants')
    .update({ confirmed_at: now })
    .in('session_id', [scannerSessionId, scannedSessionId])

  res.json({ ok: true, confirmed_at: now })
}
