const { createClient } = require('@supabase/supabase-js')
const { v4: uuidv4 } = require('uuid')

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'genofy2025'

function supabase() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY)
}

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
}

module.exports = async function handler(req, res) {
  cors(res)
  if (req.method === 'OPTIONS') return res.status(200).end()

  const action = req.query.action

  // ── GET state ─────────────────────────────────────────────────────────────
  if (action === 'state' && req.method === 'GET') {
    const { eventId } = req.query
    if (!eventId) return res.status(400).json({ error: 'eventId requerido' })
    const { data } = await supabase()
      .from('sorteo_events')
      .select('state, countdown_start_at, countdown_seconds')
      .eq('event_id', eventId)
      .single()
    return res.json(data || { state: 'inactive', countdown_start_at: null, countdown_seconds: 5 })
  }

  // ── POST activate ─────────────────────────────────────────────────────────
  if (action === 'activate' && req.method === 'POST') {
    const { eventId, password } = req.body
    if (!eventId) return res.status(400).json({ error: 'eventId requerido' })
    if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Contraseña incorrecta' })
    await supabase().from('sorteo_events').upsert(
      { event_id: eventId, state: 'active', countdown_start_at: null, updated_at: new Date().toISOString() },
      { onConflict: 'event_id' }
    )
    return res.json({ ok: true, state: 'active' })
  }

  // ── POST countdown ────────────────────────────────────────────────────────
  if (action === 'countdown' && req.method === 'POST') {
    const { eventId, password, seconds = 5 } = req.body
    if (!eventId) return res.status(400).json({ error: 'eventId requerido' })
    if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Contraseña incorrecta' })
    const now = new Date().toISOString()
    await supabase().from('sorteo_events').upsert(
      { event_id: eventId, state: 'countdown', countdown_start_at: now, countdown_seconds: seconds, updated_at: now },
      { onConflict: 'event_id' }
    )
    return res.json({ ok: true, state: 'countdown', countdown_start_at: now, countdown_seconds: seconds })
  }

  // ── POST photo ────────────────────────────────────────────────────────────
  if (action === 'photo' && req.method === 'POST') {
    const { eventId, sessionId, selfie } = req.body
    if (!eventId || !sessionId || !selfie) return res.status(400).json({ error: 'Faltan datos' })

    const db = supabase()
    const base64 = selfie.replace(/^data:image\/\w+;base64,/, '')
    const buffer = Buffer.from(base64, 'base64')
    const filename = `${eventId}/${sessionId}.jpg`

    const { error: uploadError } = await db.storage
      .from('sorteo-selfies')
      .upload(filename, buffer, { contentType: 'image/jpeg', upsert: true })
    if (uploadError) return res.status(500).json({ error: uploadError.message })

    const { data: { publicUrl } } = db.storage.from('sorteo-selfies').getPublicUrl(filename)

    await db.from('sorteo_participants').upsert(
      { session_id: sessionId, event_id: eventId, selfie_url: publicUrl },
      { onConflict: 'session_id' }
    )

    const { data: candidates } = await db
      .from('sorteo_participants')
      .select('*')
      .eq('event_id', eventId)
      .neq('session_id', sessionId)
      .is('paired_session_id', null)
      .not('selfie_url', 'is', null)
      .limit(1)

    if (candidates?.length > 0) {
      const partner = candidates[0]
      const { count } = await db.from('sorteo_participants')
        .update({ paired_session_id: sessionId, paired_selfie_url: publicUrl })
        .eq('id', partner.id)
        .is('paired_session_id', null)
        .select('id', { count: 'exact', head: true })

      if (!count || count === 0) return res.json({ status: 'waiting' })

      await db.from('sorteo_participants')
        .update({ paired_session_id: partner.session_id, paired_selfie_url: partner.selfie_url })
        .eq('session_id', sessionId)

      return res.json({ status: 'paired', partner_selfie_url: partner.selfie_url, partner_session_id: partner.session_id })
    }

    return res.json({ status: 'waiting' })
  }

  // ── GET pair-status ───────────────────────────────────────────────────────
  if (action === 'pair-status' && req.method === 'GET') {
    const { sessionId } = req.query
    if (!sessionId) return res.status(400).json({ error: 'sessionId requerido' })
    const { data } = await supabase()
      .from('sorteo_participants')
      .select('paired_session_id, paired_selfie_url, confirmed_at')
      .eq('session_id', sessionId)
      .single()
    if (!data) return res.json({ status: 'waiting' })
    if (data.confirmed_at) return res.json({ status: 'confirmed' })
    if (data.paired_session_id) return res.json({ status: 'paired', partner_selfie_url: data.paired_selfie_url, partner_session_id: data.paired_session_id })
    return res.json({ status: 'waiting' })
  }

  // ── POST confirm ──────────────────────────────────────────────────────────
  if (action === 'confirm' && req.method === 'POST') {
    const { scannerSessionId, scannedSessionId } = req.body
    if (!scannerSessionId || !scannedSessionId) return res.status(400).json({ error: 'Faltan datos' })
    const db = supabase()
    const { data: scanner } = await db
      .from('sorteo_participants')
      .select('paired_session_id, confirmed_at')
      .eq('session_id', scannerSessionId)
      .single()
    if (!scanner) return res.status(404).json({ error: 'Participante no encontrado' })
    if (scanner.paired_session_id !== scannedSessionId) return res.status(400).json({ error: 'No son pareja' })
    if (scanner.confirmed_at) return res.json({ ok: true, already: true })
    const now = new Date().toISOString()
    await db.from('sorteo_participants')
      .update({ confirmed_at: now })
      .in('session_id', [scannerSessionId, scannedSessionId])
    return res.json({ ok: true, confirmed_at: now })
  }

  res.status(400).json({ error: 'Acción no reconocida' })
}
