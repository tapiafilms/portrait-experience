const { createClient } = require('@supabase/supabase-js')

const WORKER_URL = 'https://wufly-push.pablo77tapia.workers.dev'

module.exports = async function handler(req, res) {
  if (req.method === 'POST') {
    // Iniciar job en el Worker → devuelve requestId para polling
    const { sessionId } = req.query
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY)

    const { data: session } = await supabase.from('sessions').select('*').eq('id', sessionId).single()
    if (!session) return res.status(404).json({ error: 'Sesión no encontrada' })

    try {
      const workerRes = await fetch(`${WORKER_URL}/api/portrait-transform`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: session.image_url, sessionId }),
      })

      if (!workerRes.ok) throw new Error(`Worker error: ${workerRes.status}`)
      const data = await workerRes.json()
      return res.json(data)
    } catch (err) {
      console.error('[transform start]', err.message)
      return res.status(500).json({ error: err.message })
    }
  }

  if (req.method === 'PATCH') {
    // Guardar resultado final en DB
    const { sessionId } = req.query
    const { transformedImageUrl } = req.body
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY)

    await supabase.from('sessions').update({ transformed_url: transformedImageUrl }).eq('id', sessionId)
    return res.json({ ok: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
