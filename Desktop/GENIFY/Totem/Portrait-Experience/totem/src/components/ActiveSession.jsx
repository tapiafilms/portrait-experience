import { useState, useEffect, useCallback, useRef } from 'react'
import { useSharedCamera } from '../context/CameraContext'
import { usePhotographer } from '../hooks/usePhotographer'
import CameraFeed from './CameraFeed'
import CountdownCapture from './CountdownCapture'
import AvatarDisplay from './AvatarDisplay'
import { useEvent } from '../context/EventContext'
import { uploadCapture } from '../services/api'

const IDLE_TIMEOUT = 180_000

const STATE_LABELS = {
  greeting:  'Escuchando...',
  listening: 'Escuchando...',
  thinking:  'Pensando...',
}

export default function ActiveSession({ onCaptureDone, onReset }) {
  const { videoRef, ready, error, captureFrame } = useSharedCamera()
  const { event } = useEvent()
  const [phase, setPhase] = useState('conversation')
  const [userName, setUserName] = useState(null)
  const [uploadError, setUploadError] = useState(null)
  const [cameraReady, setCameraReady] = useState(false)
  const [keyboardInput, setKeyboardInput] = useState('')
  const inputRef = useRef(null)
  const photographerRef = useRef(null)

  const handleCapture = useCallback(() => {
    photographerRef.current?.stop()
    setPhase('countdown')
  }, [])

  const [guestId, setGuestId] = useState(null)

  const handleGuestIdentified = useCallback((guest) => {
    setUserName(guest.nombre)
    setGuestId(guest.id ?? null)
  }, [])

  const conversation = usePhotographer({
    onCapture: handleCapture,
    onGuestIdentified: handleGuestIdentified,
    event,
  })

  useEffect(() => { photographerRef.current = conversation }, [conversation])

  useEffect(() => {
    if (ready && !cameraReady) setCameraReady(true)
  }, [ready, cameraReady])

  useEffect(() => {
    if (cameraReady && conversation.state === 'idle') {
      const t = setTimeout(() => conversation.start(), 800)
      return () => clearTimeout(t)
    }
  }, [cameraReady])

  useEffect(() => {
    const t = setTimeout(onReset, IDLE_TIMEOUT)
    return () => clearTimeout(t)
  }, [onReset])

  const handleCountdownCapture = useCallback(async () => {
    setPhase('uploading')
    try {
      const blob = await captureFrame()
      if (!blob) throw new Error('No se pudo capturar el frame')
      const data = await uploadCapture(blob, event?.eventId)
      onCaptureDone(data, userName, guestId)
    } catch (err) {
      setUploadError(err.message)
      setPhase('error')
    }
  }, [captureFrame, onCaptureDone, userName, guestId])

  const currentLabel = STATE_LABELS[conversation.state] || ''
  const [showText, setShowText] = useState(false)

  return (
    <div style={s.root}>

      {/* Fondo */}
      <img src="/bg-totem.png" alt="" style={s.bg} />
      <div style={s.bgOverlay} />

      {/* Contenedor centrado con max-width */}
      <div style={s.inner}>

      {/* Header */}
      <div style={s.header}>
        <img src="/logo-ai-portrait-experience.png" alt="AI Portrait Experience" style={s.logoTitle} />
      </div>

      {/* Tarjeta central — avatar del fotógrafo */}
      <div style={s.cardZone}>
        <div style={s.card}>

          {/* Fondo futurista */}
          <div style={s.avatarBg}>
            <div style={s.blob1} />
            <div style={s.blob2} />
            <div style={s.blob3} />
            <div style={s.scanLine} />
          </div>

          <div style={{
            position: 'absolute', bottom: 0, left: '50%', width: '130%', height: '130%', zIndex: 1,
            transform: `translateX(-50%) ${conversation.state === 'countdown' || phase === 'countdown' ? 'translateY(80%) scale(2.15)' : 'scale(1.0)'}`,
            transformOrigin: 'bottom center',
            transition: 'transform 1.2s cubic-bezier(0.34, 1.1, 0.64, 1)',
          }}>
            <AvatarDisplay
              state={conversation.state === 'countdown' || phase === 'countdown' ? 'countdown' : conversation.isSpeaking ? 'talking' : conversation.state}
              size="100%"
            />
          </div>

          {phase === 'countdown' && (
            <CountdownCapture onCapture={handleCountdownCapture} seconds={3} />
          )}

          {phase === 'uploading' && (
            <div style={s.cardOverlay}>
              <div style={s.spinner} />
              <p style={s.overlayText}>Procesando imagen...</p>
            </div>
          )}

          {phase === 'error' && (
            <div style={s.cardOverlay}>
              <p style={s.errorText}>⚠ {uploadError}</p>
              <button style={s.retryBtn} onClick={() => setPhase('conversation')}>
                Reintentar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Zona inferior — PiP cámara + burbuja */}
      <div style={s.bottomZone}>

        {/* PiP: cámara del usuario */}
        <div style={s.pipWrap}>
          {error ? (
            <div style={s.pipError}><span style={{ fontSize: 20 }}>⚠</span></div>
          ) : (
            <CameraFeed videoRef={videoRef} />
          )}
        </div>

        {/* Burbuja + estado */}
        <div style={s.bubbleCol}>
          {/* Botón escribir — siempre visible */}
          {phase === 'conversation' && (
            <button style={s.writeBtn} onClick={() => setShowText(v => !v)}>
              {showText ? 'cerrar' : 'escribir'}
            </button>
          )}

          {/* Texto + input — solo si showText */}
          {showText && (
            <>
              {conversation.avatarText && phase === 'conversation' && (
                <div style={s.bubble}>
                  {userName && <p style={s.bubbleName}>👋 {userName}</p>}
                  <p style={s.bubbleText}>{conversation.avatarText}</p>
                  {currentLabel && (
                    <div style={s.listeningIndicator}>
                      <div style={s.dot} />
                      <div style={{ ...s.dot, animationDelay: '0.2s' }} />
                      <div style={{ ...s.dot, animationDelay: '0.4s' }} />
                      <span style={s.listeningLabel}>{currentLabel}</span>
                    </div>
                  )}
                </div>
              )}

              {phase === 'conversation' && conversation.state === 'listening' && (
                <input
                  ref={inputRef}
                  style={s.keyboardInput}
                  value={keyboardInput}
                  onChange={e => setKeyboardInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && keyboardInput.trim()) {
                      conversation.sendManualInput(keyboardInput.trim())
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
    animation: 'fadeIn 0.4s ease',
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
    width: '100%', padding: '28px 55px 0',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  logoTitle: {
    height: '80px', objectFit: 'contain',
  },
  logoGenofy: {
    height: '26px', objectFit: 'contain',
  },
  cardZone: {
    flex: 1, minHeight: 0, zIndex: 2,
    display: 'flex', alignItems: 'stretch',
    padding: '12px 55px 10px',
    width: '100%',
  },
  card: {
    flex: 1, minHeight: 0,
    borderRadius: '28px',
    overflow: 'hidden',
    border: '1.5px solid rgba(100,160,255,0.35)',
    boxShadow: '0 0 60px rgba(30,100,255,0.2)',
    position: 'relative',
    background: '#020818',
  },
  avatarBg: {
    position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden',
  },
  blob1: {
    position: 'absolute',
    width: '70%', height: '70%',
    top: '5%', left: '15%',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(30,80,255,0.12) 0%, transparent 70%)',
    filter: 'blur(40px)',
    animation: 'avatarBlob1 10s ease-in-out infinite',
  },
  blob2: {
    position: 'absolute',
    width: '50%', height: '50%',
    bottom: '10%', right: '5%',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(0,180,255,0.10) 0%, transparent 70%)',
    filter: 'blur(35px)',
    animation: 'avatarBlob2 13s ease-in-out infinite',
  },
  blob3: {
    position: 'absolute',
    width: '40%', height: '40%',
    top: '40%', left: '5%',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(80,40,200,0.08) 0%, transparent 70%)',
    filter: 'blur(30px)',
    animation: 'avatarBlob3 9s ease-in-out infinite',
  },
  scanLine: {
    position: 'absolute',
    left: 0, right: 0,
    height: '1px',
    background: 'linear-gradient(90deg, transparent, rgba(100,180,255,0.15), transparent)',
    animation: 'avatarScan 6s ease-in-out infinite',
  },
  cardOverlay: {
    position: 'absolute', inset: 0,
    background: 'rgba(0,0,0,0.75)',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', gap: '20px', zIndex: 5,
  },
  bottomZone: {
    flexShrink: 0,
    zIndex: 2,
    width: '100%', padding: '12px 55px 28px',
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
  pipError: {
    width: '100%', height: '100%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: '#0a0a0a', color: '#f87171',
  },
  bubbleCol: {
    flex: 1, display: 'flex', flexDirection: 'column', gap: '8px',
  },
  bubble: {
    background: 'rgba(255,255,255,0.95)',
    borderRadius: '16px', padding: '14px 18px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
  },
  bubbleName: {
    fontSize: '13px', fontWeight: 800,
    background: 'linear-gradient(90deg, #a855f7, #22d3ee)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
    marginBottom: '4px', letterSpacing: '1px',
  },
  bubbleText: {
    fontSize: '15px', color: '#1a1a2e',
    fontWeight: 600, lineHeight: 1.5,
  },
  listeningIndicator: {
    display: 'flex', alignItems: 'center', gap: '5px', marginTop: '8px',
  },
  dot: {
    width: '5px', height: '5px', borderRadius: '50%',
    background: '#a855f7', animation: 'pulse 1s ease-in-out infinite',
  },
  listeningLabel: {
    fontSize: '10px', color: '#a855f7',
    letterSpacing: '2px', fontWeight: 600,
    textTransform: 'uppercase', marginLeft: '3px',
  },
  keyboardInput: {
    width: '100%', padding: '12px 16px',
    fontSize: '15px', borderRadius: '50px',
    border: '1.5px solid rgba(168,85,247,0.6)',
    background: 'rgba(0,0,0,0.7)', color: '#fff',
    outline: 'none', boxSizing: 'border-box',
    backdropFilter: 'blur(10px)',
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
  spinner: {
    width: '48px', height: '48px', borderRadius: '50%',
    border: '3px solid rgba(168,85,247,0.2)',
    borderTopColor: '#a855f7',
    animation: 'spin 0.8s linear infinite',
  },
  overlayText: {
    fontSize: '16px', color: 'rgba(255,255,255,0.7)', letterSpacing: '2px',
  },
  errorBox: {
    width: '100%', height: '100%',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', gap: '12px', background: '#0a0a0a',
  },
  errorText: { color: '#f87171', fontSize: '18px' },
  errorSub: { color: 'rgba(255,255,255,0.3)', fontSize: '13px' },
  retryBtn: {
    background: 'linear-gradient(90deg, #a855f7, #22d3ee)',
    color: '#fff', border: 'none',
    padding: '12px 32px', fontSize: '16px', fontWeight: 700,
    borderRadius: '50px', cursor: 'pointer',
  },
}
