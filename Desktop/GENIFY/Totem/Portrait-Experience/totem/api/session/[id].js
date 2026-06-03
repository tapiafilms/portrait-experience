const { createClient } = require('@supabase/supabase-js')

module.exports = async function handler(req, res) {
  const { id } = req.query
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)

  const { data: session } = await supabase
    .from('sessions')
    .select('id, image_url, transformed_url, qr_data_url, event_id')
    .eq('id', id).single()

  if (!session) return res.status(404).json({ error: 'Sesión no encontrada' })

  // Si piden JSON, devolver datos
  if (req.headers.accept?.includes('application/json')) {
    // Cargar fotos del carrusel (otras sesiones del mismo evento con foto transformada)
    let carousel = []
    if (session.event_id) {
      const { data } = await supabase
        .from('sessions')
        .select('id, transformed_url')
        .eq('event_id', session.event_id)
        .not('transformed_url', 'is', null)
        .neq('id', id)
        .order('created_at', { ascending: false })
        .limit(20)
      carousel = data || []
    }

    return res.json({
      id: session.id,
      photoUrl: session.transformed_url || session.image_url,
      eventId: session.event_id,
      carousel,
    })
  }

  // Si no, redirigir a la foto (fallback para QR viejos)
  res.redirect(302, session.transformed_url || session.image_url)
}
