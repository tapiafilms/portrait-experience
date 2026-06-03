import { useState, useRef, useCallback, useEffect } from 'react'
import { speak, cancelSpeech, VOICE_IDS } from '../services/voice'

const BASE = import.meta.env.VITE_API_URL || ''

export function useAssistant({ guestId, onEnd }) {
  const [state, setState]       = useState('idle')
  const [avatarText, setAvatar] = useState(null)
  const [isSpeaking, setIsSpeaking] = useState(false)

  const activeRef  = useRef(false)
  const historyRef = useRef([])
  const recognRef  = useRef(null)
  const timeoutRef = useRef(null)
  const sessionId  = useRef(`assist-${Date.now()}`)
  const onEndRef   = useRef(onEnd)

  useEffect(() => { onEndRef.current = onEnd }, [onEnd])

  const listen = useCallback((onResult, onSilence, ms = 8000) => {
    clearTimeout(timeoutRef.current)
    if (recognRef.current) {
      recognRef.current.onresult = null
      recognRef.current.onerror  = null
      recognRef.current.onend    = null
      try { recognRef.current.abort() } catch {}
    }

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { setTimeout(onSilence, 2000); return }

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
      console.log('[Assistant Mic]', t)
      if (activeRef.current) onResult(t)
    }

    r.onerror = (e) => { if (e.error !== 'aborted') console.warn('[SR Assistant]', e.error) }
    r.onend = () => {}

    try { r.start() } catch { onSilence(); return }

    timeoutRef.current = setTimeout(() => {
      if (!gotResult && activeRef.current) {
        r.onresult = null; r.onerror = null; r.onend = null
        try { r.abort() } catch {}
        onSilence()
      }
    }, ms)
  }, [])

  const sendTurn = useCallback(async (message) => {
    const res = await fetch(`${BASE}/api/assistant/turn`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: sessionId.current,
        message,
        history: historyRef.current,
        guestId,
      }),
    })
    const data = await res.json()
    historyRef.current = data.history || historyRef.current
    return data
  }, [guestId])

  const processResponse = useCallback(async (data) => {
    if (!activeRef.current) return

    setAvatar(data.speech)
    const wordCount = data.speech.split(/\s+/).length
    const minDuration = Math.max(1500, wordCount * 380)
    await Promise.all([
      speak(data.speech, { voiceId: VOICE_IDS.assistant, onStart: () => setIsSpeaking(true) }),
      new Promise(r => setTimeout(r, minDuration)),
    ])
    setIsSpeaking(false)
    if (!activeRef.current) return

    if (data.action === 'end_conversation') {
      activeRef.current = false
      setState('ending')
      await new Promise(r => setTimeout(r, 1500))
      onEndRef.current?.()
      return
    }

    await new Promise(r => setTimeout(r, 400))
    if (!activeRef.current) return
    setState('listening')

    listen(
      async (transcript) => {
        if (!activeRef.current) return
        setState('thinking')
        setAvatar('...')
        const next = await sendTurn(transcript).catch(() => null)
        if (next) processResponse(next)
      },
      async () => {
        if (!activeRef.current) return
        // Sin respuesta → despedirse
        const next = await sendTurn('[El invitado no respondió — despídete amablemente]').catch(() => null)
        if (next) processResponse(next)
      },
      20000
    )
  }, [listen, sendTurn])

  const start = useCallback(async () => {
    activeRef.current = true
    historyRef.current = []
    setState('greeting')

    try {
      const data = await sendTurn('[El invitado acaba de escanear su código QR. Salúdalo con su información de mesa.]')
      processResponse(data)
    } catch (err) {
      console.error('[Assistant start]', err)
      stop()
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

  const sendManualInput = useCallback(async (text) => {
    if (!activeRef.current || !text.trim()) return
    clearTimeout(timeoutRef.current)
    setState('thinking')
    setAvatar('...')
    const next = await sendTurn(text.trim()).catch(() => null)
    if (next) processResponse(next)
  }, [sendTurn, processResponse])

  useEffect(() => () => stop(), [stop])

  return { state, avatarText, isSpeaking, start, stop, sendManualInput }
}
