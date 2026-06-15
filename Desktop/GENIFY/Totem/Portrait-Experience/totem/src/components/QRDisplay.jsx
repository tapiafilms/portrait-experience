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
  const [showText, setShowText] = useState(false)
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

      {/* Fondo — siempre 100% viewport */}
      <img src="/bg-totem.png" alt="" style={s.bg} />
      <div style={s.bgOverlay} />

      {/* Contenedor centrado con max-width */}
      <div style={s.inner}>

        {/* Header */}
        <div style={s.header}>
          <img src="/logo-ai-portrait-experience.png" alt="AI Portrait Experience" style={s.logoTitle} />
          <img src="/logo-genofy-transparent.png" alt="Genofy" style={s.logoGenofy} />
        </div>

        {/* Tarjeta central — avatar del asistente */}
        <div style={s.cardZone}>
          <div style={s.card}>
            <AvatarVideo
              isSpeaking={assistant.isSpeaking}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        </div>

        {/* Zona inferior — foto + QR + escribir */}
        <div style={s.bottomZone}>

          {/* Foto transformada (PiP) */}
          <div style={s.pipWrap}>
            <img src={imageUrl} alt="Tu retrato" style={s.pipPhoto} />
          </div>

          {/* Columna derecha: QR + timer + botón + burbuja */}
          <div style={s.rightCol}>

            {/* QR + info */}
            <div style={s.qrRow}>
              <div style={s.qrBox}>
                {qrDataUrl
                  ? <img src={qrDataUrl} alt="QR" style={s.qrImg} />
                  : <div style={s.spinner} />
                }
              </div>
              <div style={s.qrInfo}>
                <p style={s.qrTitle}>¡Tu retrato está listo!</p>
                <p style={s.qrSub}>Escanea para descargarlo</p>
                <div style={s.timerBar}>
                  <div style={{ ...s.timerFill, width: `${(secondsLeft / 180) * 100}%` }} />
                </div>
                <p style={s.timerText}>Volviendo al inicio en {secondsLeft}s</p>
                <button style={s.newBtn} onClick={onReset}>Nueva foto</button>
              </div>
            </div>

            {/* Botón escribir + burbuja */}
            <div style={s.bubbleCol}>
              <button style={s.writeBtn} onClick={() => setShowText(v => !v)}>
                {showText ? 'cerrar' : 'escribir'}
              </button>

              {showText && (
                <>
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
                          setShowText(false)
                        }
                      }}
                      placeholder="Escribe tu respuesta y presiona Enter..."
                      autoFocus
                    />
                  )}
                </>
              )}
            </div>

          </div>
        </div>

      </div>{/* /inner */}
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
  inner: {
    position: 'relative', zIndex: 2,
    width: '100%', maxWidth: '1000px',
    height: '100%', minHeight: 0,
    display: 'flex', flexDirection: 'column',
    alignItems: 'center',
  },
  header: {
    flexShrink: 0,
    width: '100%', padding: '28px 28px 0',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  logoTitle: {
    height: '34px', objectFit: 'contain',
  },
  logoGenofy: {
    height: '26px', objectFit: 'contain',
  },
  cardZone: {
    flex: 1, minHeight: 0, zIndex: 2,
    display: 'flex', alignItems: 'stretch',
    padding: '16px 32px 0',
    width: '100%',
  },
  card: {
    flex: 1, minHeight: 0,
    borderRadius: '28px',
    overflow: 'hidden',
    border: '1.5px solid rgba(100,160,255,0.35)',
    boxShadow: '0 0 60px rgba(30,100,255,0.2)',
    position: 'relative',
    background: '#000',
  },
  bottomZone: {
    flexShrink: 0,
    zIndex: 2,
    width: '100%', padding: '12px 32px 28px',
    display: 'flex', alignItems: 'flex-end', gap: '12px',
  },
  pipWrap: {
    position: 'relative',
    width: 180, height: 230,
    borderRadius: '16px', overflow: 'hidden', flexShrink: 0,
    border: '2px solid rgba(100,160,255,0.5)',
    boxShadow: '0 0 20px rgba(30,100,255,0.4)',
    background: '#000',
  },
  pipPhoto: {
    width: '100%', height: '100%',
    objectFit: 'cover',
    transform: 'scaleX(-1)',
  },
  rightCol: {
    flex: 1, display: 'flex', flexDirection: 'column', gap: '8px',
  },
  qrRow: {
    display: 'flex', alignItems: 'center', gap: '14px',
  },
  qrBox: {
    width: '110px', height: '110px', flexShrink: 0,
    background: '#fff', borderRadius: '12px', padding: '8px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 0 20px rgba(96,165,250,0.3)',
  },
  qrImg: { width: '100%', height: '100%', objectFit: 'contain' },
  spinner: {
    width: '28px', height: '28px', borderRadius: '50%',
    border: '3px solid rgba(96,165,250,0.2)',
    borderTopColor: '#60a5fa',
    animation: 'spin 0.8s linear infinite',
  },
  qrInfo: {
    flex: 1, display: 'flex', flexDirection: 'column', gap: '5px',
  },
  qrTitle: {
    fontSize: '16px', fontWeight: 800,
    color: '#fff',
  },
  qrSub: {
    fontSize: '12px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.4,
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
    fontSize: '10px', color: 'rgba(255,255,255,0.35)', letterSpacing: '1px',
  },
  newBtn: {
    alignSelf: 'flex-start',
    background: 'transparent',
    border: '1px solid rgba(96,165,250,0.5)',
    color: '#60a5fa', padding: '6px 20px',
    fontSize: '11px', fontWeight: 700, letterSpacing: '2px',
    borderRadius: '50px', cursor: 'pointer', textTransform: 'uppercase',
  },
  bubbleCol: {
    display: 'flex', flexDirection: 'column', gap: '8px',
  },
  writeBtn: {
    alignSelf: 'flex-start',
    background: 'rgba(168,85,247,0.15)',
    border: '1px solid rgba(168,85,247,0.5)',
    color: 'rgba(255,255,255,0.85)',
    padding: '6px 18px', borderRadius: '50px',
    cursor: 'pointer', fontSize: '12px',
    fontWeight: 600, letterSpacing: '1px',
    backdropFilter: 'blur(8px)',
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
