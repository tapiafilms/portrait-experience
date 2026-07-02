const { Readable } = require('stream')

module.exports = async function handler(req, res) {
  let text, voiceId
  if (req.method === 'POST') {
    text = req.body.text
    voiceId = req.body.voiceId
  } else if (req.method === 'GET') {
    text = req.query.text
    voiceId = req.query.voiceId
  } else {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!text) return res.status(400).json({ error: 'Falta text' })

  const apiKey = process.env.VITE_ELEVENLABS_API_KEY || process.env.ELEVENLABS_API_KEY
  const resolvedVoiceId = voiceId
    || process.env.VITE_ELEVENLABS_VOICE_ID_PHOTOGRAPHER
    || process.env.ELEVENLABS_VOICE_ID_PHOTOGRAPHER
    || 'EXAVITQu4vr4xnSDxMaL'

  if (!apiKey) return res.status(500).json({ error: 'ElevenLabs API key no configurada' })

  // optimize_streaming_latency=2 proporciona una respuesta ultra rápida optimizada para tiempo real
  const upstream = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${resolvedVoiceId}/stream?optimize_streaming_latency=2`,
    {
      method: 'POST',
      headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.5, similarity_boost: 0.8 },
      }),
    }
  )

  if (!upstream.ok) {
    const body = await upstream.text()
    console.error('[TTS proxy]', upstream.status, body)
    return res.status(upstream.status).json({ error: body })
  }

  res.setHeader('Content-Type', 'audio/mpeg')
  res.setHeader('Cache-Control', 'no-store')

  // Pipear el stream web de ElevenLabs al response de Node.js en chunks para reproducción inmediata
  Readable.fromWeb(upstream.body).pipe(res)
}
