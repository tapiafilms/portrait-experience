const Anthropic = require('@anthropic-ai/sdk')
const guests = require('../data/guests.json')

const EVENT_NAME = process.env.EVENT_NAME || 'Vision Futuro 2024'

let client = null
function getClient() {
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  return client
}

// ── Búsqueda de invitados ─────────────────────────────────────────────────

function searchGuest(nombre, apellido) {
  const n = (nombre || '').toLowerCase().trim()
  const a = (apellido || '').toLowerCase().trim()
  return guests.find(g =>
    g.nombre.toLowerCase().includes(n) &&
    (!a || g.apellido.toLowerCase().includes(a))
  ) || null
}

function searchGuestByFullName(fullName) {
  const parts = fullName.toLowerCase().trim().split(/\s+/)
  return guests.find(g => {
    const gn = g.nombre.toLowerCase()
    const ga = g.apellido.toLowerCase()
    return parts.some(p => gn.includes(p)) && parts.some(p => ga.includes(p))
  }) || null
}

// ── Sistema del Fotógrafo ─────────────────────────────────────────────────

const PHOTOGRAPHER_SYSTEM = `Eres Alex, el fotógrafo avatar del evento corporativo "${EVENT_NAME}".
Eres amigable, cálido, profesional y conciso. Hablas en español neutro.
Tu objetivo: saludar al invitado, obtener su nombre y apellido, buscarlo en la base de datos, y prepararlo para la foto.

REGLAS IMPORTANTES:
- Sé breve. Máximo 2 oraciones por respuesta.
- Hablas en voz alta con la persona frente al tótem.
- Cuando tengas nombre y apellido, búscalos con la herramienta buscar_invitado.
- Si el invitado está en la lista: salúdalo por nombre y dile que lo vas a fotografiar.
- Si no está en la lista: continúa igual, trátalo como invitado especial.
- Cuando el invitado confirme que está listo, responde con action: "start_countdown".
- No repitas preguntas que ya hiciste.

FLUJO ESPERADO:
1. Saludo cálido y pregunta cómo está
2. Pide nombre y apellido
3. Busca en la base de datos
4. Prepara para la foto y pregunta si está listo
5. Cuando diga "sí" o similar → action: start_countdown

Responde SIEMPRE en este JSON exacto:
{"speech": "lo que dices en voz alta", "action": null, "guestId": null}

Solo cambia action a "start_countdown" cuando el invitado confirme que está listo para la foto.
Solo incluye guestId cuando encuentres al invitado en la base de datos.`

const PHOTOGRAPHER_TOOLS = [{
  name: 'buscar_invitado',
  description: 'Busca un invitado en la base de datos del evento por nombre y apellido',
  input_schema: {
    type: 'object',
    properties: {
      nombre:   { type: 'string', description: 'Nombre del invitado' },
      apellido: { type: 'string', description: 'Apellido del invitado' },
    },
    required: ['nombre'],
  },
}]

async function photographerTurn({ history, userMessage }) {
  const anthro = getClient()

  const messages = [
    ...history,
    { role: 'user', content: userMessage },
  ]

  let response = await anthro.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 300,
    system: PHOTOGRAPHER_SYSTEM,
    tools: PHOTOGRAPHER_TOOLS,
    messages,
  })

  // Manejar tool use
  let guestData = null
  if (response.stop_reason === 'tool_use') {
    const toolUse = response.content.find(b => b.type === 'tool_use')
    if (toolUse?.name === 'buscar_invitado') {
      const { nombre, apellido } = toolUse.input
      guestData = searchGuest(nombre, apellido)

      const toolResult = {
        type: 'tool_result',
        tool_use_id: toolUse.id,
        content: guestData
          ? JSON.stringify({ encontrado: true, ...guestData })
          : JSON.stringify({ encontrado: false, mensaje: 'Invitado no encontrado en la lista' }),
      }

      // Segunda llamada con el resultado del tool
      response = await anthro.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        system: PHOTOGRAPHER_SYSTEM,
        tools: PHOTOGRAPHER_TOOLS,
        messages: [
          ...messages,
          { role: 'assistant', content: response.content },
          { role: 'user',      content: [toolResult] },
        ],
      })
    }
  }

  // Extraer JSON de la respuesta
  const text = response.content.find(b => b.type === 'text')?.text || ''
  let parsed = { speech: text, action: null, guestId: null }
  try {
    const match = text.match(/\{[\s\S]*\}/)
    if (match) parsed = { ...parsed, ...JSON.parse(match[0]) }
  } catch {}

  if (guestData && !parsed.guestId) parsed.guestId = guestData.id

  return {
    speech:    parsed.speech || text,
    action:    parsed.action || null,
    guestId:   parsed.guestId || (guestData?.id ?? null),
    guestData: guestData || null,
    assistantMessage: { role: 'assistant', content: response.content },
  }
}

// ── Sistema del Asistente ─────────────────────────────────────────────────

const EVENT_INFO = `
INFORMACIÓN DEL EVENTO "${EVENT_NAME}":
- Fecha: Esta noche
- Venue: Salón Principal, Hotel Grand Hyatt Santiago
- Dress code: Formal
- Cóctel de bienvenida: 19:00 hrs (terraza)
- Cena: 20:30 hrs (salón principal)
- Presentación CEO: 21:15 hrs
- Premio Innovación del Año: 22:00 hrs
- Música en vivo: 22:30 hrs
- Fin del evento: 00:00 hrs
- Estacionamiento: Disponible en subterráneo, validación en recepción
- Menú: Entrada fría + cordero al horno / opción vegetariana disponible
- Open bar durante toda la noche
- WiFi: RedEventoCorp / Clave: Futuro2024
`

function buildAssistantSystem(guest) {
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
- Responde solo preguntas relacionadas con el evento.
- Cuando el invitado se despida o diga que no tiene más preguntas, despídete y responde con action: "end_conversation".

Responde SIEMPRE en este JSON:
{"speech": "lo que dices", "action": null}`
}

async function assistantTurn({ history, userMessage, guest }) {
  const anthro = getClient()

  const messages = [
    ...history,
    { role: 'user', content: userMessage },
  ]

  const response = await anthro.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 400,
    system: buildAssistantSystem(guest),
    messages,
  })

  const text = response.content.find(b => b.type === 'text')?.text || ''
  let parsed = { speech: text, action: null }
  try {
    const match = text.match(/\{[\s\S]*\}/)
    if (match) parsed = { ...parsed, ...JSON.parse(match[0]) }
  } catch {}

  return {
    speech:  parsed.speech || text,
    action:  parsed.action || null,
    assistantMessage: { role: 'assistant', content: response.content },
  }
}

module.exports = { photographerTurn, assistantTurn, searchGuest, searchGuestByFullName, guests }
