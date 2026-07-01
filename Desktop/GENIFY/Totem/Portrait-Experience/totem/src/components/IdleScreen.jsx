import { useSharedCamera } from '../context/CameraContext'
import { usePresenceDetection } from '../hooks/usePresenceDetection'
import { unlockAudio } from '../services/voice'
import AvatarVideo from './AvatarVideo'

export default function IdleScreen({ onPresenceDetected }) {
  const { videoRef, rawRef, ready } = useSharedCamera()

  usePresenceDetection({
    videoRef: rawRef,
    active: ready,
    onPresence: () => {}, // mantener cámara activa pero no disparar automático
  })

  const handleTouch = () => {
    unlockAudio()
    onPresenceDetected()
  }

  return (
    <div style={s.root}>
      {/* Cámara oculta para detección de presencia */}
      <video ref={videoRef} style={s.hiddenVideo} muted playsInline />

      {/* Fondo */}
      <img src="/bg-totem.png" alt="" style={s.bg} />
      <div style={s.bgOverlay} />

      {/* Logo AI Portrait Experience */}
      <div style={s.header}>
        <img src="/logo-gen-ex.png" alt="AI Portrait Experience" style={s.logoTitle} />
      </div>

      {/* Avatar en tarjeta */}
      <div style={s.avatarZone}>
        <div style={s.avatarCard}>
          <AvatarVideo isSpeaking={true} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      </div>

      {/* CTA — botones */}
      <div style={s.ctaZone}>
        <button style={s.ctaBtn} onClick={handleTouch} onTouchStart={handleTouch}>
          <span style={s.ctaBtnText}>TOCA PARA COMENZAR</span>
          <div style={s.ctaDots}>
            <div style={s.dot} />
            <div style={{ ...s.dot, animationDelay: '0.2s' }} />
            <div style={{ ...s.dot, animationDelay: '0.4s' }} />
          </div>
        </button>
        <a href="/admin" style={s.adminLink}>Panel de control</a>
      </div>

      {/* Logo Genofy */}
      <div style={s.footer}>
        <p style={s.footerTag}>TECNOLOGÍA</p>
        <img src="/logo-genofy-transparent.png" alt="Genofy" style={s.logoGenofy} />
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
  },
  hiddenVideo: {
    position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none',
  },
  bg: {
    position: 'absolute', inset: 0,
    width: '100%', height: '100%',
    objectFit: 'cover', zIndex: 0,
  },
  bgOverlay: {
    position: 'absolute', inset: 0, zIndex: 1,
    background: 'linear-gradient(to bottom, rgba(0,5,30,0.3) 0%, rgba(0,5,30,0.1) 40%, rgba(0,5,30,0.4) 100%)',
  },
  header: {
    zIndex: 2, paddingTop: '48px',
    display: 'flex', justifyContent: 'center',
  },
  logoTitle: {
    width: '125px', objectFit: 'contain',
  },
  avatarZone: {
    flex: 1, zIndex: 2,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '24px 40px 0',
    width: '100%',
  },
  avatarCard: {
    width: '500px', height: '580px',
    borderRadius: '28px',
    overflow: 'hidden',
    border: '1.5px solid rgba(100,160,255,0.35)',
    boxShadow: '0 0 60px rgba(30,100,255,0.2), inset 0 0 30px rgba(0,10,40,0.4)',
    background: 'rgba(0,10,40,0.5)',
  },
  ctaZone: {
    zIndex: 2, paddingTop: '20px',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: '14px',
  },
  adminLink: {
    fontSize: '11px', letterSpacing: '2px', fontWeight: 600,
    color: 'rgba(255,255,255,0.25)',
    textDecoration: 'none',
    textTransform: 'uppercase',
  },
  ctaBtn: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
    background: 'rgba(255,255,255,0.06)',
    border: '1.5px solid rgba(100,180,255,0.5)',
    borderRadius: '50px',
    padding: '18px 48px',
    cursor: 'pointer',
    backdropFilter: 'blur(8px)',
    boxShadow: '0 0 30px rgba(96,165,250,0.2)',
    transition: 'all 0.2s ease',
    WebkitTapHighlightColor: 'transparent',
  },
  ctaBtnText: {
    fontSize: '16px', fontWeight: 800, letterSpacing: '5px',
    color: 'rgba(255,255,255,0.9)',
  },
  ctaDots: {
    display: 'flex', gap: '8px',
  },
  dot: {
    width: '7px', height: '7px', borderRadius: '50%',
    background: 'rgba(100,180,255,0.8)',
    animation: 'pulse 1.2s ease-in-out infinite',
  },
  footer: {
    zIndex: 2, paddingBottom: '36px', paddingTop: '16px',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: '2px',
  },
  footerTag: {
    fontSize: '9px', letterSpacing: '4px',
    color: 'rgba(255,255,255,0.45)', fontWeight: 600,
    textTransform: 'uppercase',
  },
  logoGenofy: {
    height: '36px', objectFit: 'contain',
  },
}
