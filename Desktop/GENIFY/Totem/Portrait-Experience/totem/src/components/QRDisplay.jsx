import { useEffect, useState, useCallback, useRef } from 'react'
import { speak } from '../services/voice'
import AvatarVideo from './AvatarVideo'
import { useEvent } from '../context/EventContext'
import { useAssistant } from '../hooks/useAssistant'

const AUTO_RESET = 180_000

export default function QRDisplay({ sessionData, onReset }) {
  const { imageUrl, qrDataUrl, guestId } = sessionData
  const [secondsLeft, setSecondsLeft] = useState(180)
  const [keyboardInput, setKeyboardInput] = useState('')
  const inputRef = useRef(null)

  const handleAssistantEnd = useCallback(() => {
    setTimeout(onReset, 2000)
  }, [onReset])

  const { event } = useEvent()
  const assistant = useAssistant({ guestId, onEnd: handleAssistantEnd, event })

  useEffect(() => {
    speak('¡Tu retrato está listo! Escanea el código QR para descargarlo.')
      .catch(() => {})
      .finally(() => {
        setTimeout(() => assistant.start(), 1000)
      })
    const t = setTimeout(onReset, AUTO_RESET)
    return () => clearTimeout(t)
  }, []) // eslint-disable-line

  useEffect(() => {
    const interval = setInterval(() => setSecondsLeft(s => Math.max(0, s - 1)), 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={s.root}>

      {/* Fondo */}
      <img src="/bg-totem.png" alt="" style={s.bg} />
      <div style={s.bgOverlay} />

      {/* Header */}
      <div style={s.header}>
        <img src="/logo-ai-portrait-experience.png" alt="AI Portrait Experience" style={s.logoTitle} />
        <img src="/logo-genofy-transparent.png" alt="Genofy" style={s.logoGenofy} />
      </div>

      {/* Contenido central */}
      <div style={s.content}>

        {/* Foto transformada */}
        <div style={s.photoCard}>
          <img src={imageUrl} alt="Tu retrato" style={s.photo} />
        </div>

        {/* QR */}
        <div style={s.qrSection}>
          <p style={s.qrTitle}>¡Tu retrato está listo!</p>
          <p style={s.qrSub}>Escanea para descargar tu imagen</p>
          <div style={s.qrBox}>
            {qrDataUrl
              ? <img src={qrDataUrl} alt="QR" style={s.qrImg} />
              : <div style={s.spinner} />
            }
          </div>
          <div style={s.timerBar}>
            <div style={{ ...s.timerFill, width: `${(secondsLeft / 180) * 100}%` }} />
          </div>
          <p style={s.timerText}>Volviendo al inicio en {secondsLeft}s</p>
          <button style={s.newBtn} onClick={onReset}>Nueva foto</button>
        </div>
      </div>

      {/* Zona inferior — Luna + burbuja */}
      <div style={s.bottomZone}>

        {/* Avatar Luna */}
        <div style={s.avatarWrap}>
          <AvatarVideo
            isSpeaking={assistant.isSpeaking}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>

        {/* Burbuja + input */}
        <div style={s.bubbleCol}>
          {assistant.avatarText && (
            <div style={s.bubble}>
              <p style={s.assistantName}>
                Luna · Asistente Virtual
                {assistant.state === 'listening' && <span style={s.listeningDot}> 🎙️</span>}
              </p>
              <p style={s.bubbleText}>{assistant.avatarText}</p>
              {assistant.state === 'listening' && (
                <div style={s.dots}>
                  <div style={s.dot} />
                  <div style={{ ...s.dot, animationDelay: '0.2s' }} />
                  <div style={{ ...s.dot, animationDelay: '0.4s' }} />
                </div>
              )}
            </div>
          )}

          {assistant.state === 'listening' && (
            <input
              ref={inputRef}
              style={s.keyboardInput}
              value={keyboardInput}
              onChange={e => setKeyboardInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && keyboardInput.trim()) {
                  assistant.sendManualInput(keyboardInput.trim())
                  setKeyboardInput('')
                }
              }}
              placeholder="Escribe tu respuesta y presiona Enter..."
              autoFocus
            />
          )}
        </div>
      </div>

    </div>
  )
}

const s = {
  root: {
    width: '100vw', height: '100vh',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center',
    position: 'relative', overflow: 'hidden',
    animation: 'fadeIn 0.6s ease',
  },
  bg: {
    position: 'absolute', inset: 0,
    width: '100%', height: '100%',
    objectFit: 'cover', zIndex: 0,
  },
  bgOverlay: {
    position: 'absolute', inset: 0, zIndex: 1,
    background: 'linear-gradient(to bottom, rgba(0,5,30,0.4) 0%, rgba(0,5,30,0.2) 50%, rgba(0,5,30,0.6) 100%)',
  },
  header: {
    position: 'relative', zIndex: 2,
    width: '100%', padding: '28px 28px 0',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  logoTitle: {
    height: '34px', objectFit: 'contain',
  },
  logoGenofy: {
    height: '26px', objectFit: 'contain',
  },
  content: {
    flex: 1, zIndex: 2,
    display: 'flex', gap: '24px',
    alignItems: 'center', justifyContent: 'center',
    padding: '16px 28px 0',
    width: '100%',
  },
  photoCard: {
    width: '260px', flexShrink: 0,
    borderRadius: '20px', overflow: 'hidden',
    border: '1.5px solid rgba(100,160,255,0.35)',
    boxShadow: '0 0 40px rgba(30,100,255,0.2)',
  },
  photo: {
    width: '100%', display: 'block',
    objectFit: 'cover',
    transform: 'scaleX(-1)',
  },
  qrSection: {
    flex: 1,
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: '12px',
  },
  qrTitle: {
    fontSize: '22px', fontWeight: 800,
    color: '#fff', textAlign: 'center',
  },
  qrSub: {
    fontSize: '13px', color: 'rgba(255,255,255,0.6)',
    textAlign: 'center', lineHeight: 1.5,
  },
  qrBox: {
    width: '180px', height: '180px',
    background: '#fff', borderRadius: '16px', padding: '10px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 0 30px rgba(96,165,250,0.3)',
  },
  qrImg: { width: '100%', height: '100%', objectFit: 'contain' },
  spinner: {
    width: '36px', height: '36px', borderRadius: '50%',
    border: '3px solid rgba(96,165,250,0.2)',
    borderTopColor: '#60a5fa',
    animation: 'spin 0.8s linear infinite',
  },
  timerBar: {
    width: '100%', height: '2px',
    background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden',
  },
  timerFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #3b82f6, #60a5fa)',
    transition: 'width 1s linear',
  },
  timerText: {
    fontSize: '11px', color: 'rgba(255,255,255,0.4)', letterSpacing: '1px',
  },
  newBtn: {
    background: 'transparent',
    border: '1px solid rgba(96,165,250,0.5)',
    color: '#60a5fa', padding: '10px 32px',
    fontSize: '13px', fontWeight: 700, letterSpacing: '2px',
    borderRadius: '50px', cursor: 'pointer', textTransform: 'uppercase',
  },
  bottomZone: {
    zIndex: 2,
    width: '100%', padding: '12px 20px 28px',
    display: 'flex', alignItems: 'flex-end', gap: '12px',
  },
  avatarWrap: {
    width: 120, height: 150,
    borderRadius: '16px', overflow: 'hidden', flexShrink: 0,
    border: '1.5px solid rgba(100,160,255,0.4)',
    boxShadow: '0 0 24px rgba(30,100,255,0.3)',
  },
  bubbleCol: {
    flex: 1, display: 'flex', flexDirection: 'column', gap: '8px',
  },
  bubble: {
    background: 'rgba(255,255,255,0.95)',
    borderRadius: '16px', padding: '14px 18px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
  },
  assistantName: {
    fontSize: '11px', fontWeight: 700, letterSpacing: '1px',
    color: '#6d28d9', marginBottom: '6px', textTransform: 'uppercase',
  },
  listeningDot: { fontSize: '12px' },
  bubbleText: {
    fontSize: '14px', color: '#1a1a2e',
    fontWeight: 500, lineHeight: 1.5,
  },
  dots: {
    display: 'flex', gap: '5px', marginTop: '8px',
  },
  dot: {
    width: '5px', height: '5px', borderRadius: '50%',
    background: '#6d28d9', animation: 'pulse 1s ease-in-out infinite',
  },
  keyboardInput: {
    width: '100%', padding: '12px 16px',
    fontSize: '15px', borderRadius: '50px',
    border: '1.5px solid rgba(168,85,247,0.6)',
    background: 'rgba(0,0,0,0.7)', color: '#fff',
    outline: 'none', boxSizing: 'border-box',
    backdropFilter: 'blur(10px)',
  },
}
