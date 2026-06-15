import { useState, useRef, useCallback, useEffect } from 'react'
import { speak, cancelSpeech, VOICE_IDS } from '../services/voice'

const BASE = import.meta.env.VITE_API_URL || ''
const YES_WORDS = ['sí', 'si', 'yes', 'dale', 'listo', 'lista', 'ya', 'vamos', 'ok', 'claro', 'bueno', 'adelante']

export function usePhotographer({ onCapture, onGuestIdentified, event }) {
  const [state, setState]       = useState('idle')
  const [avatarText, setAvatar] = useState(null)
  const [guestData, setGuest]   = useState(null)
  const [isSpeaking, setIsSpeaking] = useState(false)

  const activeRef      = useRef(false)
  const historyRef     = useRef([])
  const recognRef      = useRef(null)
  const timeoutRef     = useRef(null)
  const sessionId      = useRef(`photo-${Date.now()}`)
  const onCaptureRef   = useRef(onCapture)
  const silenceCount   = useRef(0)
  const MAX_SILENCES   = 6

  useEffect(() => { onCaptureRef.current = onCapture }, [onCapture])

  // ── Escuchar ──────────────────────────────────────────────────────────────
  const listen = useCallback((onResult, onSilence, ms = 7000) => {
    clearTimeout(timeoutRef.current)
    if (recognRef.current) {
      recognRef.current.onresult = null
      recognRef.current.onerror  = null
      recognRef.current.onend    = null
      try { recognRef.current.abort() } catch {}
    }

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { setTimeout(onSilence, 1500); return }

    // Pequeño delay para que Chrome re-inicialice el micrófono entre sesiones
    setTimeout(() => {
    const r = new SR()
    r.lang = 'es-ES'
    r.continuous = false
    r.interimResults = false
    r.maxAlternatives = 3
    recognRef.current = r

    let gotResult = false

    r.onresult = (e) => {
      gotResult = true
      clearTimeout(timeoutRef.current)
      r.onresult = null; r.onerror = null; r.onend = null
      try { r.abort() } catch {}
      const t = Array.from(e.results)
        .flatMap(res => Array.from(res).map(a => a.transcript))
        .join(' ').toLowerCase().trim()
      console.log('[Mic]', t)
      if (activeRef.current) onResult(t)
    }

    // No usamos onend/onerror para detectar silencio — son poco confiables en Electron
    r.onerror = (e) => { if (e.error !== 'aborted') console.warn('[SR]', e.error) }
    r.onend = () => {}

    try { r.start() } catch { onSilence(); return }

    // Nuestro propio timer controla el silencio
    timeoutRef.current = setTimeout(() => {
      if (!gotResult && activeRef.current) {
        r.onresult = null; r.onerror = null; r.onend = null
        try { r.abort() } catch {}
        onSilence()
      }
    }, ms)
    }, 500) // delay para re-inicializar mic entre sesiones
  }, [])

  // ── Enviar turno a Claude ─────────────────────────────────────────────────
  const sendTurn = useCallback(async (message) => {
    const res = await fetch(`${BASE}/api/photographer/turn`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: sessionId.current,
        message,
        history: historyRef.current,
        eventName: event?.eventName,
        guests: event?.guests,
      }),
    })
    const data = await res.json()
    historyRef.current = data.history || historyRef.current
    return data
  }, [])

  // ── Procesar respuesta de Claude ─────────────────────────────────────────
  const processResponse = useCallback(async (data) => {
    if (!activeRef.current) return

    if (data.guestData && !guestData) {
      setGuest(data.guestData)
      onGuestIdentified?.(data.guestData)
    }

    setAvatar(data.speech)
    setIsSpeaking(true)
    const wordCount = data.speech.split(/\s+/).length
    const minDuration = Math.max(1500, wordCount * 380)
    await Promise.all([
      speak(data.speech, { voiceId: VOICE_IDS.photographer }).catch(err => console.warn('[speak]', err)),
      new Promise(r => setTimeout(r, minDuration)),
    ])
    setIsSpeaking(false)
    if (!activeRef.current) return

    if (data.action === 'start_countdown') {
      setState('countdown')
      activeRef.current = false
      cancelSpeech()
      onCaptureRef.current?.()
      return
    }

    // Esperar respuesta del usuario
    await new Promise(r => setTimeout(r, 400))
    if (!activeRef.current) return
    setState('listening')

    listen(
      async (transcript) => {
        if (!activeRef.current) return
        silenceCount.current = 0
        setState('thinking')
        setAvatar('...')
        try {
          const next = await sendTurn(transcript)
          processResponse(next)
        } catch (err) {
          console.error('[Photographer]', err)
          setState('listening')
        }
      },
      async () => {
        if (!activeRef.current) return
        silenceCount.current++
        // Demasiados silencios → disparar foto directamente
        if (silenceCount.current >= MAX_SILENCES) {
          activeRef.current = false
          onCaptureRef.current?.()
          return
        }
        const next = await sendTurn('[silencio — el usuario no respondió]').catch(() => null)
        if (next) processResponse(next)
      }
    )
  }, [guestData, listen, sendTurn, onGuestIdentified])

  // ── Inicio ────────────────────────────────────────────────────────────────
  const start = useCallback(async () => {
    activeRef.current = true
    historyRef.current = []
    silenceCount.current = 0
    setState('greeting')

    try {
      const data = await sendTurn('[El invitado acaba de acercarse al tótem. Inicia la conversación.]')
      processResponse(data)
    } catch (err) {
      console.error('[Photographer start]', err)
      // Fallback sin Claude
      setAvatar('¡Hola! Bienvenido al evento. ¿Cómo estás?')
      await speak('¡Hola! Bienvenido al evento. ¿Cómo estás?')
    }
  }, [sendTurn, processResponse])

  const stop = useCallback(() => {
    activeRef.current = false
    clearTimeout(timeoutRef.current)
    cancelSpeech()
    try { recognRef.current?.abort() } catch {}
    setState('idle')
    setAvatar(null)
  }, [])

  // Inyectar texto manualmente (teclado / modo debug)
  const sendManualInput = useCallback(async (text) => {
    if (!activeRef.current || !text.trim()) return
    clearTimeout(timeoutRef.current)
    silenceCount.current = 0
    setState('thinking')
    setAvatar('...')
    try {
      const next = await sendTurn(text.trim())
      processResponse(next)
    } catch (err) {
      console.error('[Photographer manual]', err)
      setState('listening')
    }
  }, [sendTurn, processResponse])

  useEffect(() => () => stop(), [stop])

  return { state, avatarText, guestData, isSpeaking, start, stop, sendManualInput }
}
