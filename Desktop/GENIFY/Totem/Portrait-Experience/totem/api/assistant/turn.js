const Anthropic = require('@anthropic-ai/sdk')
const guests = require('../../server/data/guests.json')

const conversations = new Map()
const EVENT_NAME = process.env.EVENT_NAME || 'Vision Futuro 2024'

function buildSystem(guest, eventTitle) {
  const guestInfo = guest
    ? `INVITADO: ${guest.nombre} ${guest.apellido} | Cargo: ${guest.cargo} | Área: ${guest.area} | Mesa: ${guest.mesa} | Compañeros de mesa: ${(guest.compañeros || []).join(', ')}`
    : 'INVITADO: Invitado especial (no registrado en la lista)'

  return `Eres Luna, la asistente virtual del evento "${eventTitle}". Eres amable, elegante y muy eficiente.
Hablas en español neutro. Eres concisa — máximo 3 oraciones por respuesta.

${guestInfo}

Tu objetivo: orientar al invitado, responder sus preguntas sobre el evento, y despedirte cuando no tenga más preguntas.
Si el invitado pregunta algo que no sabes con certeza, di que puedes preguntar al equipo organizador.

REGLAS:
- Saluda por nombre si lo conoces.
- Menciona su mesa y compañeros en el saludo inicial.
- Cuando el invitado se despida, responde con action: "end_conversation".

Responde SIEMPRE en este JSON:
{"speech": "lo que dices", "action": null}`
}

async function fetchDocAsBase64(url) {
  const resp = await fetch(url)
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
  const buf = await resp.arrayBuffer()
  return Buffer.from(buf).toString('base64')
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { sessionId, message, history = [], guestId, eventName, guests: eventGuests, documentUrl } = req.body
  if (!sessionId || !message) return res.status(400).json({ error: 'Faltan campos' })

  const guestList = Array.isArray(eventGuests) && eventGuests.length > 0 ? eventGuests : guests
  const guest = guestId ? guestList.find(g => g.id === guestId) : null
  const eventTitle = eventName || EVENT_NAME
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  // Si hay documento del evento, cargarlo como contexto previo
  let docPreamble = []
  if (documentUrl) {
    try {
      const b64 = await fetchDocAsBase64(documentUrl)
      docPreamble = [
        {
          role: 'user',
          content: [{
            type: 'document',
            source: { type: 'base64', media_type: 'application/pdf', data: b64 },
            cache_control: { type: 'ephemeral' },
          }],
        },
        {
          role: 'assistant',
          content: 'Entendido. He revisado el briefing del evento y lo usaré para responder las preguntas de los invitados.',
        },
      ]
    } catch (e) {
      console.warn('[assistant] no se pudo cargar el documento:', e.message)
    }
  }

  const messages = [...docPreamble, ...history, { role: 'user', content: message }]

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      system: buildSystem(guest, eventTitle),
      messages,
    })

    const text = response.content.find(b => b.type === 'text')?.text || ''
    let parsed = { speech: text, action: null }
    try { const m = text.match(/\{[\s\S]*\}/); if (m) parsed = { ...parsed, ...JSON.parse(m[0]) } } catch {}

    const conv = conversations.get(sessionId) || []
    conv.push({ role: 'user', content: message })
    conv.push({ role: 'assistant', content: response.content })
    conversations.set(sessionId, conv)

    res.json({
      speech: parsed.speech || text,
      action: parsed.action || null,
      history: conv,
    })
  } catch (err) {
    console.error('[assistant]', err.message)
    res.status(500).json({ error: err.message })
  }
}
