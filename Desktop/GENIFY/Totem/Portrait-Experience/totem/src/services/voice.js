// Abstracción de voz. Provider activo se controla con VITE_VOICE_PROVIDER.
// 'browser' → Web Speech API (gratis, offline)
// 'elevenlabs' → ElevenLabs API (requiere VITE_ELEVENLABS_API_KEY y VITE_ELEVENLABS_VOICE_ID)

const PROVIDER = import.meta.env.VITE_VOICE_PROVIDER || 'browser'

// ---------- Audio unlock (autoplay policy) ----------
// Windows y algunos browsers bloquean el audio hasta que el usuario interactúa.
// Creamos un AudioContext silencioso en el primer gesto para desbloquearlo.
let _audioUnlocked = false
export function unlockAudio() {
  if (_audioUnlocked) return
  _audioUnlocked = true
  try {
    // Unlock AudioContext (para el analizador de voz)
    const ctx = new AudioContext()
    const buf = ctx.createBuffer(1, 1, 22050)
    const src = ctx.createBufferSource()
    src.buffer = buf
    src.connect(ctx.destination)
    src.start(0)
    ctx.resume().catch(() => {})
  } catch {}
  try {
    // Unlock HTML Audio element — Chrome los trata por separado del AudioContext.
    // Necesario para que ElevenLabs pueda llamar audio.play() fuera del gesto.
    const a = new Audio()
    a.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA='
    a.play().catch(() => {})
  } catch {}
}

// ---------- Browser (Web Speech API) ----------

// Las voces cargan asíncronamente — esperar hasta que estén disponibles
function getVoices() {
  return new Promise(resolve => {
    const voices = window.speechSynthesis.getVoices()
    if (voices.length > 0) return resolve(voices)
    window.speechSynthesis.addEventListener('voiceschanged', () => {
      resolve(window.speechSynthesis.getVoices())
    }, { once: true })
    // Timeout de seguridad: si no llegan voces en 2s, continuar sin ellas
    setTimeout(() => resolve([]), 2000)
  })
}

function speakBrowser(text, { lang = 'es-ES', rate = 0.92, pitch = 1.05 } = {}) {
  return new Promise(async (resolve, reject) => {
    if (!window.speechSynthesis) return reject(new Error('Web Speech API no disponible'))
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang
    utterance.rate = rate
    utterance.pitch = pitch

    // Esperar voces antes de asignar
    const voices = await getVoices()
    const esVoice = voices.find(v => v.lang.startsWith('es') && v.localService)
      || voices.find(v => v.lang.startsWith('es'))
    if (esVoice) utterance.voice = esVoice

    let resolved = false
    const cleanup = () => {
      if (resolved) return
      resolved = true
      clearTimeout(safetyTimer)
      resolve()
    }

    // Timer de seguridad: aproximadamente 500ms por palabra + 2 segundos
    const wordCount = text.split(/\s+/).length
    const safetyDuration = Math.max(2500, wordCount * 500 + 2000)
    const safetyTimer = setTimeout(() => {
      console.warn('[speakBrowser] Fallback timeout disparado (onend no se ejecutó)')
      try { window.speechSynthesis.cancel() } catch {}
      cleanup()
    }, safetyDuration)

    utterance.onend = () => {
      cleanup()
    }
    utterance.onerror = (e) => {
      if (e.error === 'interrupted' || e.error === 'canceled') {
        cleanup()
      } else {
        clearTimeout(safetyTimer)
        reject(e)
      }
    }
    window.speechSynthesis.speak(utterance)
  })
}

// ---------- ElevenLabs ----------

let currentAudio = null
let currentResolve = null  // para poder resolver la Promise desde cancelSpeech

function normalizeText(text) {
  return text
    .replace(/\b(\d+):(\d{2})\s*hrs?\b/gi, (_, h, m) => `${h}${m === '00' ? '' : ' y ' + m} horas`)
    .replace(/\b(\d+)\s*hrs?\b/gi, (_, h) => `${h} horas`)
    .replace(/\bkm\b/gi, 'kilómetros')
    .replace(/\bkg\b/gi, 'kilogramos')
    .replace(/\bdr\.\s*/gi, 'doctor ')
    .replace(/\bdra\.\s*/gi, 'doctora ')
    .replace(/\bsr\.\s*/gi, 'señor ')
    .replace(/\bsra\.\s*/gi, 'señora ')
}

async function speakElevenLabs(text, { voiceId, onStart, onPause, onResume } = {}) {
  text = normalizeText(text)

  const BASE = import.meta.env.VITE_API_URL || ''
  const url = `${BASE}/api/tts?text=${encodeURIComponent(text)}&voiceId=${voiceId || ''}`

  const audio = new Audio(url)
  currentAudio = audio

  return new Promise(resolve => {
    currentResolve = resolve

    const cleanup = () => {
      currentResolve = null
      resolve()
    }

    // Timer de seguridad dinámico basado en la cantidad de palabras
    const wordCount = text.split(/\s+/).length
    const safetyDuration = Math.max(3000, wordCount * 600 + 4000)
    const safetyTimer = setTimeout(() => {
      console.warn('[speakElevenLabs] Fallback timeout disparado (onended no se ejecutó)')
      cleanup()
    }, safetyDuration)

    audio.onended = () => {
      console.log('[ElevenLabs] audio.onended')
      clearTimeout(safetyTimer)
      cleanup()
    }
    audio.onerror = (e) => {
      console.warn('[ElevenLabs] Audio error:', e)
      clearTimeout(safetyTimer)
      cleanup()
    }

    audio.play()
      .then(() => {
        console.log('[ElevenLabs] play() OK (stream streaming) → onStart')
        onStart?.()
      })
      .catch(e => {
        console.warn('[ElevenLabs] play() FALLÓ:', e.name, e.message)
        onStart?.()  // animar avatar aunque el audio no salga
        clearTimeout(safetyTimer)
        cleanup()
      })
  })
}

// ---------- API pública ----------

export function speak(text, options = {}) {
  if (PROVIDER === 'elevenlabs') {
    return speakElevenLabs(text, options).catch(err => {
      console.warn('[ElevenLabs] falló, usando browser TTS:', err.message)
      options.onStart?.()
      return speakBrowser(text, options).catch(() => {})
    })
  }
  options.onStart?.()
  return speakBrowser(text, options)
}

export const VOICE_IDS = {
  photographer: import.meta.env.VITE_ELEVENLABS_VOICE_ID_PHOTOGRAPHER,
  assistant:    import.meta.env.VITE_ELEVENLABS_VOICE_ID_ASSISTANT,
}

export function cancelSpeech() {
  if (PROVIDER === 'browser') window.speechSynthesis?.cancel()
  if (currentAudio) {
    currentAudio.pause()
    currentAudio.currentTime = 0
    currentAudio = null
  }
  if (currentResolve) {
    const r = currentResolve
    currentResolve = null
    r()
  }
}

// Frases del avatar por contexto
export const SCRIPTS = {
  greeting: (name) =>
    name
      ? `¡Bienvenido, ${name}! Soy tu fotógrafo virtual. Vamos a crear algo increíble juntos.`
      : `¡Bienvenido! Soy tu fotógrafo virtual. Vamos a crear algo increíble juntos.`,

  pose: [
    'Perfecto. Ahora mira directamente a la cámara.',
    'Excelente. Inclina levemente el mentón hacia abajo.',
    'Muy bien. Relaja los hombros y sonríe naturalmente.',
    'Casi listo. Respira hondo y mantente quieto.',
  ],

  countdown: (n) => n > 0 ? `${n}` : '¡Foto!',

  processing: '¡Fantástico! Estoy transformando tu imagen. Espera un momento.',

  ready: '¡Tu retrato está listo! Escanea el código QR para descargarlo.',

  goodbye: 'Fue un placer. ¡Que disfrutes tu retrato!',
}
