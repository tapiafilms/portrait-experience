const { createClient } = require('@supabase/supabase-js')

module.exports = async function handler(req, res) {
  const { id } = req.query
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)

  const { data: session } = await supabase
    .from('sessions').select('image_url, transformed_url').eq('id', id).single()

  if (!session) return res.status(404).send('Sesión no encontrada')

  // Redirigir siempre a la mejor foto disponible
  const photoUrl = session.transformed_url || session.image_url
  res.redirect(302, photoUrl)
}
