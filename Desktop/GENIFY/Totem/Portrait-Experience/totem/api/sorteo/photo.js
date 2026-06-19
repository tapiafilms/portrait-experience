const { createClient } = require('@supabase/supabase-js')

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { eventId, sessionId, selfie } = req.body
  if (!eventId || !sessionId || !selfie) return res.status(400).json({ error: 'Faltan datos' })

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)

  // Subir selfie a Supabase Storage
  const base64 = selfie.replace(/^data:image\/\w+;base64,/, '')
  const buffer = Buffer.from(base64, 'base64')
  const filename = `${eventId}/${sessionId}.jpg`

  const { error: uploadError } = await supabase.storage
    .from('sorteo-selfies')
    .upload(filename, buffer, { contentType: 'image/jpeg', upsert: true })

  if (uploadError) return res.status(500).json({ error: uploadError.message })

  const { data: { publicUrl } } = supabase.storage.from('sorteo-selfies').getPublicUrl(filename)

  // Registrar participante
  await supabase.from('sorteo_participants').upsert(
    { session_id: sessionId, event_id: eventId, selfie_url: publicUrl },
    { onConflict: 'session_id' }
  )

  // Buscar pareja disponible (sin pareja aún, con selfie, distinto session_id)
  const { data: candidates } = await supabase
    .from('sorteo_participants')
    .select('*')
    .eq('event_id', eventId)
    .neq('session_id', sessionId)
    .is('paired_session_id', null)
    .not('selfie_url', 'is', null)
    .limit(1)

  if (candidates?.length > 0) {
    const partner = candidates[0]

    // Actualizar partner — si count === 0 otro request llegó primero (race condition)
    const { count } = await supabase.from('sorteo_participants')
      .update({ paired_session_id: sessionId, paired_selfie_url: publicUrl })
      .eq('id', partner.id)
      .is('paired_session_id', null)
      .select('id', { count: 'exact', head: true })

    if (!count || count === 0) {
      // Race condition: el candidato ya fue tomado, quedar en espera
      return res.json({ status: 'waiting' })
    }

    await supabase.from('sorteo_participants')
      .update({ paired_session_id: partner.session_id, paired_selfie_url: partner.selfie_url })
      .eq('session_id', sessionId)

    return res.json({ status: 'paired', partner_selfie_url: partner.selfie_url, partner_session_id: partner.session_id })
  }

  res.json({ status: 'waiting' })
}
