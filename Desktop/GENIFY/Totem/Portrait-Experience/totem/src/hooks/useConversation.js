import { useState, useRef, useCallback, useEffect } from 'react'
import { speak, cancelSpeech } from '../services/voice'

const YES_WORDS = ['sí', 'si', 'yes', 'dale', 'listo', 'lista', 'ya', 'vamos', 'ok', 'okay', 'claro', 'bueno', 'adelante', 'voy', 'puedes', 'puede']
const LISTEN_TIMEOUT = 6000
const RETRY_TIMEOUT  = 5000

export function useConversation({ onCapture, onNameDetected }) {
  const [state, setState] = useState('idle')
  const [avatarText, setAvatarText] = useState(null)
  const [userName, setUserName] = useState(null)

  const activeRef    = useRef(false)
  const recognRef    = useRef(null)
  const timeoutRef   = useRef(null)
  const onCaptureRef = useRef(onCapture)

  useEffect(() => { onCaptureRef.current = onCapture }, [onCapture])

  // ── Parar todo ────────────────────────────────────────────────────────────
  const stopAll = useCallback(() => {
    activeRef.current = false
    clearTimeout(timeoutRef.current)
    cancelSpeech()
    try { recognRef.current?.abort() } catch {}
    recognRef.current = null
  }, [])

  // ── Escuchar una vez ──────────────────────────────────────────────────────
  const listen = useCallback((onResult, onSilence, ms = LISTEN_TIMEOUT) => {
    clearTimeout(timeoutRef.current)
    try { recognRef.current?.abort() } catch {}
    recognRef.current = null

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) {
      // Sin soporte → actuar como si hubiera silencio
      timeoutRef.current = setTimeout(() => {
        if (activeRef.current) onSilence()
      }, 1500)
      return
    }

    const r = new SR()
    r.lang = 'es-CL'
    r.continuous = false
    r.interimResults = false
    r.maxAlternatives = 3
    recognRef.current = r

    let gotResult = false

    r.onresult = (e) => {
      gotResult = true
      clearTimeout(timeoutRef.current)
      const transcript = Array.from(e.results)
        .flatMap(res => Array.from(res).map(alt => alt.transcript))
        .join(' ')
        .toLowerCase()
        .trim()
      console.log('[Speech] escuché:', transcript)
      if (activeRef.current) onResult(transcript)
    }

    r.onerror = (e) => {
      if (e.error === 'no-speech' || e.error === 'aborted') return
      console.warn('[Speech] error:', e.error)
      clearTimeout(timeoutRef.current)
      if (activeRef.current && !gotResult) onSilence()
    }

    r.onend = () => {
      clearTimeout(timeoutRef.current)
      if (activeRef.current && !gotResult) onSilence()
    }

    try {
      r.start()
    } catch (e) {
      console.warn('[Speech] start error:', e)
      if (activeRef.current) onSilence()
      return
    }

    // Timeout de seguridad
    timeoutRef.current = setTimeout(() => {
      if (!gotResult) {
        try { r.abort() } catch {}
        if (activeRef.current) onSilence()
      }
    }, ms)
  }, [])

  // ── Decir y luego escuchar ────────────────────────────────────────────────
  const sayThenListen = useCallback(async (text, displayText, onResult, onSilence, ms) => {
    if (!activeRef.current) return
    setAvatarText(displayText || text)
    await speak(text)
    if (!activeRef.current) return
    // Pequeña pausa para que el micrófono no capture el eco de la voz
    await delay(300)
    if (!activeRef.current) return
    listen(onResult, onSilence, ms)
  }, [listen])

  // ── Estados del flujo ─────────────────────────────────────────────────────

  // Paso 4b: Reintento
  const retryReady = useCallback(async (name) => {
    if (!activeRef.current) return
    setState('retryReady')
    await sayThenListen(
      'Perdón, no te escuché. ¿Estás lista para la foto?',
      '¿Estás lista para la foto?',
      (t) => {
        if (!activeRef.current) return
        if (YES_WORDS.some(w => t.includes(w))) {
          setState('countdown')
          setAvatarText('¡Perfecto! Preparate...')
          stopAll()
          onCaptureRef.current?.()
        } else {
          retryReady(name)
        }
      },
      () => retryReady(name),
      RETRY_TIMEOUT
    )
  }, [sayThenListen, stopAll])

  // Paso 4: Pregunta si está lista
  const askReady = useCallback(async (name) => {
    if (!activeRef.current) return
    setState('askReady')
    const txt = name
      ? `${name}, déjame tomarte una foto para que te lleves un recuerdo del evento. ¿Estás lista?`
      : `Déjame tomarte una foto para que te lleves un recuerdo del evento. ¿Estás lista?`
    await sayThenListen(
      txt, txt,
      (t) => {
        if (!activeRef.current) return
        if (YES_WORDS.some(w => t.includes(w))) {
          setState('countdown')
          setAvatarText('¡Perfecto! Preparate...')
          stopAll()
          onCaptureRef.current?.()
        } else {
          retryReady(name)
        }
      },
      () => retryReady(name),
      LISTEN_TIMEOUT
    )
  }, [sayThenListen, stopAll, retryReady])

  // Paso 3: Pregunta el nombre
  const askName = useCallback(async () => {
    if (!activeRef.current) return
    setState('askName')
    await sayThenListen(
      '¿Cuál es tu nombre?',
      '¿Cuál es tu nombre?',
      (t) => {
        if (!activeRef.current) return
        const name = t.split(' ').slice(0, 2)
          .map(w => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ').trim()
        setUserName(name)
        onNameDetected?.(name)
        askReady(name)
      },
      () => {
        onNameDetected?.(null)
        askReady(null)
      },
      LISTEN_TIMEOUT
    )
  }, [sayThenListen, askReady, onNameDetected])

  // Paso 2: Espera respuesta al saludo
  const waitGreeting = useCallback(() => {
    if (!activeRef.current) return
    setState('waitGreeting')
    listen(
      () => askName(),
      () => askName(),
      LISTEN_TIMEOUT
    )
  }, [listen, askName])

  // Paso 1: Saludo
  const start = useCallback(async () => {
    activeRef.current = true
    setState('greeting')
    setAvatarText('¡Hola! Bienvenido al evento. ¿Cómo estás?')
    await speak('¡Hola! Bienvenido al evento. ¿Cómo estás?')
    if (activeRef.current) waitGreeting()
  }, [waitGreeting])

  const stop = useCallback(() => {
    stopAll()
    setState('idle')
    setAvatarText(null)
    setUserName(null)
  }, [stopAll])

  useEffect(() => () => stopAll(), [stopAll])

  return { state, avatarText, userName, start, stop }
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)) }
