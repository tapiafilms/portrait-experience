const Anthropic = require('@anthropic-ai/sdk')
const guests = require('../../server/data/guests.json')

const conversations = new Map()
const EVENT_NAME = process.env.EVENT_NAME || 'Vision Futuro 2024'

function searchGuest(nombre, apellido) {
  const n = (nombre || '').toLowerCase().trim()
  const a = (apellido || '').toLowerCase().trim()
  return guests.find(g =>
    g.nombre.toLowerCase().includes(n) &&
    (!a || g.apellido.toLowerCase().includes(a))
  ) || null
}

const SYSTEM = `Eres Alex, el fotógrafo avatar del evento corporativo "${EVENT_NAME}".
Eres amigable, cálido, profesional y conciso. Hablas en español neutro.
Tu objetivo: saludar al invitado, obtener su nombre y apellido, buscarlo en la base de datos, y prepararlo para la foto.

REGLAS IMPORTANTES:
- Sé breve. Máximo 2 oraciones por respuesta.
- Cuando tengas nombre y apellido, búscalos con la herramienta buscar_invitado.
- Si el invitado está en la lista: salúdalo por nombre y dile que lo vas a fotografiar.
- Si no está en la lista: continúa igual, trátalo como invitado especial.
- Cuando el invitado confirme que está listo, responde con action: "start_countdown".

Responde SIEMPRE en este JSON exacto:
{"speech": "lo que dices en voz alta", "action": null, "guestId": null}`

const TOOLS = [{
  name: 'buscar_invitado',
  description: 'Busca un invitado en la base de datos del evento por nombre y apellido',
  input_schema: {
    type: 'object',
    properties: {
      nombre: { type: 'string' },
      apellido: { type: 'string' },
    },
    required: ['nombre'],
  },
}]

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { sessionId, message, history = [] } = req.body
  if (!sessionId || !message) return res.status(400).json({ error: 'Faltan campos' })

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const messages = [...history, { role: 'user', content: message }]

  try {
    let response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      system: SYSTEM,
      tools: TOOLS,
      messages,
    })

    let guestData = null
    if (response.stop_reason === 'tool_use') {
      const toolUse = response.content.find(b => b.type === 'tool_use')
      if (toolUse?.name === 'buscar_invitado') {
        guestData = searchGuest(toolUse.input.nombre, toolUse.input.apellido)
        const toolResult = {
          type: 'tool_result',
          tool_use_id: toolUse.id,
          content: guestData
            ? JSON.stringify({ encontrado: true, ...guestData })
            : JSON.stringify({ encontrado: false }),
        }
        response = await client.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 300,
          system: SYSTEM,
          tools: TOOLS,
          messages: [
            ...messages,
            { role: 'assistant', content: response.content },
            { role: 'user', content: [toolResult] },
          ],
        })
      }
    }

    const text = response.content.find(b => b.type === 'text')?.text || ''
    let parsed = { speech: text, action: null, guestId: null }
    try { const m = text.match(/\{[\s\S]*\}/); if (m) parsed = { ...parsed, ...JSON.parse(m[0]) } } catch {}
    if (guestData && !parsed.guestId) parsed.guestId = guestData.id

    const conv = conversations.get(sessionId) || []
    conv.push({ role: 'user', content: message })
    conv.push({ role: 'assistant', content: response.content })
    conversations.set(sessionId, conv)

    res.json({
      speech: parsed.speech || text,
      action: parsed.action || null,
      guestId: parsed.guestId || (guestData?.id ?? null),
      guestData: guestData || null,
      history: conv,
    })
  } catch (err) {
    console.error('[photographer]', err.message)
    res.status(500).json({ error: err.message })
  }
}
