import { useState, useCallback, useEffect } from 'react'
import { speak } from './services/voice'
import IdleScreen from './components/IdleScreen'
import ActiveSession from './components/ActiveSession'
import VideoReveal from './components/VideoReveal'
import QRDisplay from './components/QRDisplay'
import LoginScreen from './components/LoginScreen'
import { CameraProvider } from './context/CameraContext'
import { useEvent } from './context/EventContext'
import { transformCapture } from './services/api'

export default function App() {
  const { event } = useEvent()

  // Sin evento → login (sin cámara)
  if (!event) return <LoginScreen />

  // Con evento → tótem completo con cámara
  return (
    <CameraProvider>
      <Totem />
    </CameraProvider>
  )
}

function Totem() {
  const [screen, setScreen] = useState('idle')
  const [captureData, setCaptureData] = useState(null)
  const [revealData, setRevealData] = useState(null)
  const [userName, setUserName] = useState(null)

  const handlePresenceDetected = useCallback(() => {
    if (screen === 'idle') setScreen('active')
  }, [screen])

  const handleCaptureDone = useCallback(async (data, name, guestId) => {
    setCaptureData(data)
    setUserName(name)
    setScreen('transforming')

    try {
      const result = await transformCapture({ sessionId: data.sessionId })
      setRevealData({
        originalImageUrl: data.imageUrl,
        transformedImageUrl: result.transformedImageUrl,
        qrDataUrl: data.qrDataUrl,
        downloadUrl: data.downloadUrl,
        demoMode: result.demoMode,
        guestId,
      })
      setScreen('revealing')
    } catch (err) {
      console.error('Transform error:', err)
      setRevealData({
        originalImageUrl: data.imageUrl,
        transformedImageUrl: data.imageUrl,
        qrDataUrl: data.qrDataUrl,
        downloadUrl: data.downloadUrl,
        guestId,
      })
      setScreen('revealing')
    }
  }, [])

  const handleRevealComplete = useCallback(() => setScreen('qr'), [])

  const handleReset = useCallback(() => {
    setCaptureData(null)
    setRevealData(null)
    setUserName(null)
    setScreen('idle')
  }, [])

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: '#0a0a0a' }}>

      {screen === 'idle' && (
        <IdleScreen onPresenceDetected={handlePresenceDetected} />
      )}

      {screen === 'active' && (
        <ActiveSession onCaptureDone={handleCaptureDone} onReset={handleReset} />
      )}

      {screen === 'transforming' && (
        <TransformingScreen userName={userName} />
      )}

      {screen === 'revealing' && revealData && (
        <VideoReveal
          originalUrl={revealData.originalImageUrl}
          transformedUrl={revealData.transformedImageUrl}
          onComplete={handleRevealComplete}
          userName={userName}
          eventName={import.meta.env.VITE_EVENT_NAME || 'AI Portrait Experience'}
        />
      )}

      {screen === 'qr' && revealData && (
        <QRDisplay
          sessionData={{
            imageUrl: revealData.transformedImageUrl,
            qrDataUrl: revealData.qrDataUrl,
            downloadUrl: revealData.downloadUrl,
            guestId: revealData.guestId,
          }}
          onReset={handleReset}
        />
      )}
    </div>
  )
}

function TransformingScreen({ userName }) {
  useEffect(() => {
    const msg = userName
      ? `${userName}, estamos creando tu retrato con inteligencia artificial. Dame un momento, no te vayas.`
      : 'Estamos creando tu retrato con inteligencia artificial. Dame un momento, no te vayas.'
    speak(msg, { voiceId: import.meta.env.VITE_ELEVENLABS_VOICE_ID_PHOTOGRAPHER }).catch(() => {})
  }, [])

  return (
    <div style={ts.root}>
      <img src="/bg-totem.png" alt="" style={ts.bg} />
      <div style={ts.bgOverlay} />
      <img src="/logo-ai-portrait-experience.png" alt="AI Portrait Experience" style={ts.logoTitle} />
      <div style={ts.content}>
        <div style={ts.orbWrapper}>
          <div style={ts.orb} />
          <div style={ts.orbRing} />
          <div style={ts.orbRing2} />
        </div>
        <p style={ts.label}>INTELIGENCIA ARTIFICIAL</p>
        <p style={ts.sub}>Creando tu retrato...</p>
        <div style={ts.bar}><div style={ts.barFill} /></div>
      </div>
      <div style={ts.footer}>
        <p style={ts.footerTag}>TECNOLOGÍA</p>
        <img src="/logo-genofy-transparent.png" alt="Genofy" style={ts.logoGenofy} />
      </div>
    </div>
  )
}

const ts = {
  root: { width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', position: 'relative', overflow: 'hidden', animation: 'fadeIn 0.5s ease', paddingTop: 40, paddingBottom: 36 },
  bg: { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 },
  bgOverlay: { position: 'absolute', inset: 0, zIndex: 1, background: 'linear-gradient(to bottom, rgba(0,5,30,0.4) 0%, rgba(0,5,30,0.2) 50%, rgba(0,5,30,0.6) 100%)' },
  logoTitle: { height: '42px', objectFit: 'contain', zIndex: 2 },
  content: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '28px', zIndex: 2 },
  orbWrapper: { position: 'relative', width: 160, height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  orb: { width: 80, height: 80, borderRadius: '50%', background: 'radial-gradient(circle, #60a5fa 0%, #3b82f6 50%, #1d4ed8 100%)', boxShadow: '0 0 40px rgba(96,165,250,0.7), 0 0 80px rgba(59,130,246,0.4)', animation: 'pulse 2s ease-in-out infinite', zIndex: 1 },
  orbRing: { position: 'absolute', width: 120, height: 120, borderRadius: '50%', border: '1px solid rgba(96,165,250,0.5)', animation: 'ringExpand 2s ease-out infinite' },
  orbRing2: { position: 'absolute', width: 120, height: 120, borderRadius: '50%', border: '1px solid rgba(96,165,250,0.3)', animation: 'ringExpand 2s ease-out 1s infinite' },
  label: { fontSize: 11, letterSpacing: 6, color: 'rgba(147,197,253,0.9)', fontWeight: 300, textTransform: 'uppercase' },
  sub: { fontSize: 22, color: 'rgba(255,255,255,0.9)', letterSpacing: 2, fontWeight: 300 },
  bar: { width: 240, height: 2, background: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' },
  barFill: { height: '100%', width: '100%', background: 'linear-gradient(90deg, transparent, #60a5fa, transparent)', animation: 'scanline 1.8s ease-in-out infinite' },
  footer: { zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' },
  footerTag: { fontSize: '9px', letterSpacing: '4px', color: 'rgba(255,255,255,0.45)', fontWeight: 600, textTransform: 'uppercase' },
  logoGenofy: { height: '34px', objectFit: 'contain' },
}
