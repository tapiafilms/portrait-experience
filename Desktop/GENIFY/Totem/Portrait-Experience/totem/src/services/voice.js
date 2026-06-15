// Abstracción de voz. Provider activo se controla con VITE_VOICE_PROVIDER.
// 'browser' → Web Speech API (gratis, offline)
// 'elevenlabs' → ElevenLabs API (requiere VITE_ELEVENLABS_API_KEY y VITE_ELEVENLABS_VOICE_ID)

const PROVIDER = import.meta.env.VITE_VOICE_PROVIDER || 'browser'

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

    utterance.onend = resolve
    utterance.onerror = (e) => {
      // 'interrupted' no es error real — ocurre al cancelar
      if (e.error === 'interrupted' || e.error === 'canceled') return resolve()
      reject(e)
    }
    window.speechSynthesis.speak(utterance)
  })
}

// ---------- ElevenLabs ----------

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
  const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY
  const resolvedVoiceId = voiceId
    || import.meta.env.VITE_ELEVENLABS_VOICE_ID
    || 'EXAVITQu4vr4xnSDxMaL'

  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${resolvedVoiceId}/stream`, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: { stability: 0.5, similarity_boost: 0.8 },
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    console.error('[ElevenLabs] Error:', res.status, body)
    throw new Error(`ElevenLabs error: ${res.status}`)
  }

  const arrayBuffer = await res.arrayBuffer()
  console.log('[ElevenLabs] Audio recibido, bytes:', arrayBuffer.byteLength)

  const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' })
  const url = URL.createObjectURL(blob)
  const audio = new Audio(url)

  return new Promise(resolve => {
    let animFrameId = null
    let audioCtx = null

    const stopAnalyser = () => {
      if (animFrameId) cancelAnimationFrame(animFrameId)
      if (audioCtx) audioCtx.close().catch(() => {})
    }

    const cleanup = () => { stopAnalyser(); URL.revokeObjectURL(url); resolve() }
    const safetyTimer = setTimeout(cleanup, 60_000)

    const startAnalyser = () => {
      try {
        audioCtx = new AudioContext()
        const source = audioCtx.createMediaElementSource(audio)
        const analyser = audioCtx.createAnalyser()
        analyser.fftSize = 256
        analyser.smoothingTimeConstant = 0.4
        source.connect(analyser)
        analyser.connect(audioCtx.destination)

        const dataArray = new Uint8Array(analyser.frequencyBinCount)
        const THRESHOLD = 8      // amplitud mínima para considerar "hablando"
        const SILENCE_MS = 120   // ms de silencio antes de disparar pausa
        let talkingNow = true
        let silenceStart = null

        const tick = () => {
          analyser.getByteFrequencyData(dataArray)
          const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length

          if (avg > THRESHOLD) {
            silenceStart = null
            if (!talkingNow) { talkingNow = true; onResume?.() }
          } else {
            if (!silenceStart) silenceStart = Date.now()
            if (talkingNow && Date.now() - silenceStart > SILENCE_MS) {
              talkingNow = false
              onPause?.()
            }
          }
          animFrameId = requestAnimationFrame(tick)
        }
        animFrameId = requestAnimationFrame(tick)
      } catch (e) {
        console.warn('[AudioAnalyser]', e)
      }
    }

    audio.onended = () => { clearTimeout(safetyTimer); cleanup() }
    audio.onerror = (e) => { console.warn('[ElevenLabs] Audio error:', e); clearTimeout(safetyTimer); cleanup() }
    audio.play()
      .then(() => {
        onStart?.()
        if (onPause || onResume) startAnalyser()
      })
      .catch(e => { console.warn('[ElevenLabs] play() error:', e); clearTimeout(safetyTimer); cleanup() })
  })
}

// ---------- API pública ----------

export function speak(text, options = {}) {
  if (PROVIDER === 'elevenlabs') return speakElevenLabs(text, options)
  options.onStart?.()
  return speakBrowser(text, options)
}

export const VOICE_IDS = {
  photographer: import.meta.env.VITE_ELEVENLABS_VOICE_ID_PHOTOGRAPHER,
  assistant:    import.meta.env.VITE_ELEVENLABS_VOICE_ID_ASSISTANT,
}

export function cancelSpeech() {
  if (PROVIDER === 'browser') window.speechSynthesis?.cancel()
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
