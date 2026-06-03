const Anthropic = require('@anthropic-ai/sdk')
const guests = require('../../server/data/guests.json')

const conversations = new Map()
const EVENT_NAME = process.env.EVENT_NAME || 'Vision Futuro 2024'

const EVENT_INFO = `
INFORMACIÓN DEL EVENTO "${EVENT_NAME}":
- Fecha: Esta noche
- Venue: Salón Principal, Hotel Grand Hyatt Santiago
- Dress code: Formal
- Cóctel de bienvenida: 19:00 horas (terraza)
- Cena: 20:30 horas (salón principal)
- Presentación CEO: 21:15 horas
- Premio Innovación del Año: 22:00 horas
- Música en vivo: 22:30 horas
- Fin del evento: 00:00 horas
- Estacionamiento: Disponible en subterráneo, validación en recepción
- Menú: Entrada fría + cordero al horno / opción vegetariana disponible
- Open bar durante toda la noche
- WiFi: RedEventoCorp / Clave: Futuro2024
`

function buildSystem(guest) {
  const guestInfo = guest
    ? `INVITADO: ${guest.nombre} ${guest.apellido} | Cargo: ${guest.cargo} | Área: ${guest.area} | Mesa: ${guest.mesa} | Compañeros de mesa: ${guest.compañeros.join(', ')}`
    : 'INVITADO: Invitado especial (no registrado en la lista)'

  return `Eres Luna, la asistente virtual del evento "${EVENT_NAME}". Eres amable, elegante y muy eficiente.
Hablas en español neutro. Eres concisa — máximo 3 oraciones por respuesta.

${guestInfo}
${EVENT_INFO}

Tu objetivo: orientar al invitado, responder sus preguntas sobre el evento, y despedirte cuando no tenga más preguntas.

REGLAS:
- Saluda por nombre si lo conoces.
- Menciona su mesa y compañeros en el saludo inicial.
- Cuando el invitado se despida, responde con action: "end_conversation".

Responde SIEMPRE en este JSON:
{"speech": "lo que dices", "action": null}`
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { sessionId, message, history = [], guestId, eventName, guests: eventGuests } = req.body
  if (!sessionId || !message) return res.status(400).json({ error: 'Faltan campos' })

  const guestList = Array.isArray(eventGuests) && eventGuests.length > 0 ? eventGuests : guests
  const guest = guestId ? guestList.find(g => g.id === guestId) : null
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const messages = [...history, { role: 'user', content: message }]

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      system: buildSystem(guest),
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
