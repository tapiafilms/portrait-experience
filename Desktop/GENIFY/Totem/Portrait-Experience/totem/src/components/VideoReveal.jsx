import { useState, useEffect, useRef } from 'react'

// Fases: scan → celebrate
const PHASE_LABELS = {
  scan:      'ESCANEANDO Y TRANSFORMANDO CON IA...',
  celebrate: '✦ ¡TU PERSONAJE ESTÁ LISTO! ✦',
}

export default function VideoReveal({ originalUrl, transformedUrl, onComplete, userName, eventName }) {
  const [phase, setPhase] = useState('scan')
  const canvasRef = useRef(null)
  const confettiRef = useRef(null)
  const laserRef = useRef(null)
  const animRef = useRef(null)

  useEffect(() => {
    // 3.8 segundos para completar el barrido láser, luego celebrar
    const timer1 = setTimeout(() => {
      setPhase('celebrate')
    }, 3800)

    // Terminar y pasar a la pantalla QR tras 8.5 segundos
    const timer2 = setTimeout(() => {
      onComplete?.()
    }, 8500)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
    }
  }, [onComplete])

  // Canvas de partículas del láser (erupción en el eje X del láser)
  useEffect(() => {
    if (phase !== 'scan') return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const resize = () => {
      if (!canvas) return
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const COLORS = ['#a855f7', '#22d3ee', '#ffffff', '#c8a96e']
    let particles = []

    const draw = () => {
      const W = canvas.width
      const H = canvas.height
      ctx.clearRect(0, 0, W, H)

      // Obtener la posición física actual del láser con respecto al canvas
      let laserX = W / 2
      if (laserRef.current) {
        const rect = laserRef.current.getBoundingClientRect()
        const canvasRect = canvas.getBoundingClientRect()
        laserX = rect.left - canvasRect.left + (rect.width / 2)
      }

      // Generar partículas en la línea del láser si está visible
      const isVisible = laserRef.current && parseFloat(window.getComputedStyle(laserRef.current).opacity) > 0.05
      if (isVisible) {
        for (let i = 0; i < 4; i++) {
          particles.push({
            x: laserX,
            y: Math.random() * H,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 4,
            size: 1 + Math.random() * 3,
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
            alpha: 1,
            decay: 0.02 + Math.random() * 0.03,
          })
        }
      }

      particles.forEach((p, idx) => {
        p.x += p.vx
        p.y += p.vy
        p.alpha = Math.max(0, p.alpha - p.decay)

        ctx.save()
        ctx.globalAlpha = p.alpha
        ctx.fillStyle = p.color
        ctx.shadowColor = p.color
        ctx.shadowBlur = 6
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()

        if (p.alpha <= 0) {
          particles.splice(idx, 1)
        }
      })

      animRef.current = requestAnimationFrame(draw)
    }

    animRef.current = requestAnimationFrame(draw)
    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animRef.current)
    }
  }, [phase])

  // Canvas de confetti (celebración)
  useEffect(() => {
    if (phase !== 'celebrate') return
    const canvas = confettiRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const resize = () => {
      if (!canvas) return
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const COLORS = ['#a855f7', '#22d3ee', '#84cc16', '#f59e0b', '#ffffff', '#f43f5e']
    const W = canvas.width
    const H = canvas.height
    const pieces = Array.from({ length: 120 }, () => ({
      x: Math.random() * W,
      y: -20 - Math.random() * 200,
      w: 6 + Math.random() * 8,
      h: 3 + Math.random() * 4,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rot: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.15,
      vx: (Math.random() - 0.5) * 2.5,
      vy: 2 + Math.random() * 3.5,
      alpha: 0.8 + Math.random() * 0.2,
    }))

    const draw = () => {
      ctx.clearRect(0, 0, W, H)
      pieces.forEach(p => {
        p.x += p.vx
        p.y += p.vy
        p.rot += p.rotSpeed
        if (p.y > H + 20) { p.y = -20; p.x = Math.random() * W }

        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rot)
        ctx.globalAlpha = p.alpha
        ctx.fillStyle = p.color
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
        ctx.restore()
      })
      animRef.current = requestAnimationFrame(draw)
    }
    animRef.current = requestAnimationFrame(draw)
    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animRef.current)
    }
  }, [phase])

  return (
    <div style={s.root}>
      {/* Fondo blur del evento */}
      <img src="/bg-totem.png" alt="" style={s.bg} />
      <div style={s.bgOverlay} />

      {/* Header */}
      <div style={s.header}>
        <span style={s.brand}>GENOFY</span>
        {eventName && <span style={s.eventTag}>{eventName}</span>}
      </div>

      {/* Label superior */}
      <div style={s.phaseLabel}>
        {PHASE_LABELS[phase]}
      </div>

      {/* Contenedor principal de la transición */}
      <div style={{
        ...s.mainContainer,
        transform: `translate(-50%, -50%) ${phase === 'celebrate' ? 'scale(1.02)' : 'scale(1.0)'}`,
        transition: 'transform 1s ease',
      }}>
        {/* Canvas de partículas del láser */}
        <canvas ref={canvasRef} style={s.canvas} />

        {/* Caja de la foto original */}
        <div style={{
          ...s.cardBox,
          ...s.cardBoxLeft,
          transform: phase === 'celebrate' ? 'scale(0.85) translateX(-15px)' : 'scale(1.0)',
          opacity: phase === 'celebrate' ? 0.7 : 1.0,
        }}>
          <div style={s.cardLabel}>FOTO ORIGINAL</div>
          <img src={originalUrl} alt="Original" style={s.boxImageOriginal} />
        </div>

        {/* Flecha de transición central */}
        <div style={{
          ...s.arrowWrap,
          opacity: phase === 'celebrate' ? 0.4 : 1.0,
          animation: phase === 'scan' ? 'arrowGlow 3.5s ease-in-out infinite' : 'none',
        }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </div>

        {/* Caja de la foto final (avatar procesado) */}
        <div style={{
          ...s.cardBox,
          ...s.cardBoxRight,
          transform: phase === 'celebrate' ? 'scale(1.05) translateX(15px)' : 'scale(1.0)',
          boxShadow: phase === 'celebrate' ? '0 0 40px rgba(168,85,247,0.4), 0 0 80px rgba(34,211,238,0.2)' : 'none',
        }}>
          <div style={s.cardLabel}>FOTO FINAL</div>
          
          {/* Fondo/Loader mientras se escanea */}
          <div style={s.boxImagePlaceholder} />

          {/* Imagen final revelada mediante animación CSS clip-path */}
          <img
            src={transformedUrl}
            alt="Transformed"
            style={{
              ...s.boxImageFinal,
              animation: phase === 'scan' ? 'revealPhoto 3.5s cubic-bezier(0.4, 0, 0.2, 1) forwards' : 'none',
              clipPath: phase === 'celebrate' ? 'inset(0 0 0 0)' : 'inset(0 100% 0 0)',
            }}
          />
        </div>

        {/* Línea Láser de Escaneo */}
        {phase === 'scan' && (
          <div
            ref={laserRef}
            style={{
              ...s.laserLine,
              animation: 'laserSweep 3.5s cubic-bezier(0.4, 0, 0.2, 1) forwards',
            }}
          />
        )}
      </div>

      {/* Confetti y mensaje de celebración final */}
      {phase === 'celebrate' && (
        <>
          <canvas ref={confettiRef} style={s.confettiCanvas} />
          <div style={s.celebrateInfo}>
            {userName && <p style={s.celebrateName}>¡LISTO, {userName.toUpperCase()}!</p>}
            <p style={s.celebrateSub}>Escanea el código QR a tu derecha para descargar</p>
          </div>
        </>
      )}

      {/* Estilos dinámicos inyectados para las animaciones */}
      <style>{`
        @keyframes laserSweep {
          0% { left: 0%; opacity: 0; }
          4% { opacity: 1; }
          43% { left: calc(50% - 25px); opacity: 1; }
          52% { left: calc(50% + 25px); opacity: 1; filter: hue-rotate(90deg); }
          95% { left: 100%; opacity: 1; }
          100% { left: 100%; opacity: 0; }
        }
        @keyframes revealPhoto {
          0%, 53% { clip-path: inset(0 100% 0 0); }
          95%, 100% { clip-path: inset(0 0 0 0); }
        }
        @keyframes arrowGlow {
          0%, 35%, 65%, 100% { stroke: #22d3ee; filter: drop-shadow(0 0 2px #22d3ee); }
          45%, 55% { stroke: #a855f7; filter: drop-shadow(0 0 10px #a855f7); transform: scale(1.15); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1.0; }
        }
      `}</style>
    </div>
  )
}

const s = {
  root: {
    position: 'fixed', inset: 0,
    background: '#000',
    overflow: 'hidden',
    animation: 'fadeIn 0.4s ease',
    fontFamily: "'Inter', sans-serif",
  },
  bg: {
    position: 'absolute', inset: 0,
    width: '100%', height: '100%',
    objectFit: 'cover', zIndex: 0,
    filter: 'blur(10px) brightness(0.4)',
  },
  bgOverlay: {
    position: 'absolute', inset: 0,
    zIndex: 1,
    background: 'radial-gradient(circle, transparent 20%, rgba(0,5,30,0.8) 80%)',
  },
  header: {
    position: 'absolute', top: 0, left: 0, right: 0,
    padding: '24px 55px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    background: 'linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)',
    zIndex: 20,
  },
  brand: {
    fontSize: '20px', fontWeight: 800, letterSpacing: '6px', color: '#fff',
  },
  eventTag: {
    fontSize: '13px', letterSpacing: '2px',
    color: 'rgba(255,255,255,0.6)', fontWeight: 300,
  },
  phaseLabel: {
    position: 'absolute', top: '90px', left: '50%',
    transform: 'translateX(-50%)',
    fontSize: '12px', letterSpacing: '4px', color: '#22d3ee',
    fontWeight: 600,
    background: 'rgba(0,5,30,0.65)',
    padding: '8px 24px', borderRadius: '50px',
    border: '1.5px solid rgba(34,211,238,0.3)',
    boxShadow: '0 4px 20px rgba(34,211,238,0.1)',
    zIndex: 20, whiteSpace: 'nowrap',
    textTransform: 'uppercase',
  },
  mainContainer: {
    position: 'absolute',
    top: '50%', left: '50%',
    width: '90%', maxWidth: '850px',
    aspectRatio: '16/10',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    zIndex: 10,
  },
  cardBox: {
    width: '44%',
    height: '90%',
    borderRadius: '24px',
    overflow: 'hidden',
    position: 'relative',
    background: '#010515',
    border: '1.5px solid rgba(100,160,255,0.2)',
    transition: 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
  cardBoxLeft: {
    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
  },
  cardBoxRight: {
    border: '1.5px solid rgba(168,85,247,0.3)',
  },
  cardLabel: {
    position: 'absolute', top: '16px', left: '20px',
    fontSize: '10px', letterSpacing: '3px', color: 'rgba(255,255,255,0.5)',
    fontWeight: 700, zIndex: 12,
    background: 'rgba(0,0,0,0.6)', padding: '4px 10px', borderRadius: '6px',
  },
  boxImageOriginal: {
    width: '100%', height: '100%',
    objectFit: 'cover',
    transform: 'scaleX(-1)', // Espejo como la cámara
  },
  boxImagePlaceholder: {
    position: 'absolute', inset: 0,
    background: 'radial-gradient(circle, rgba(168,85,247,0.15) 0%, transparent 80%)',
    animation: 'pulse 1.5s ease-in-out infinite',
    zIndex: 5,
  },
  boxImageFinal: {
    position: 'absolute', inset: 0,
    width: '100%', height: '100%',
    objectFit: 'cover',
    zIndex: 6,
  },
  arrowWrap: {
    width: '12%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.8s ease',
  },
  laserLine: {
    position: 'absolute',
    top: '3%',
    bottom: '3%',
    width: '3px',
    background: 'linear-gradient(to bottom, transparent, #22d3ee, #a855f7, #22d3ee, transparent)',
    boxShadow: '0 0 10px #22d3ee, 0 0 20px #a855f7, 0 0 35px #22d3ee',
    zIndex: 15,
    pointerEvents: 'none',
  },
  canvas: {
    position: 'absolute', inset: 0,
    width: '100%', height: '100%',
    pointerEvents: 'none', zIndex: 14,
  },
  confettiCanvas: {
    position: 'absolute', inset: 0,
    width: '100%', height: '100%',
    pointerEvents: 'none', zIndex: 15,
  },
  celebrateInfo: {
    position: 'absolute', bottom: '50px', left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
    zIndex: 20, animation: 'fadeIn 0.8s ease',
    background: 'rgba(0,5,30,0.65)', backdropFilter: 'blur(10px)',
    padding: '16px 36px', borderRadius: '50px',
    border: '1.5px solid rgba(168,85,247,0.3)',
    boxShadow: '0 8px 32px rgba(168,85,247,0.15)',
  },
  celebrateName: {
    fontSize: '28px', fontWeight: 800, color: '#fff', letterSpacing: '4px', margin: 0,
    textShadow: '0 0 15px rgba(255,255,255,0.3)',
  },
  celebrateSub: {
    fontSize: '12px', color: 'rgba(255,255,255,0.6)', letterSpacing: '2px', margin: 0,
    textTransform: 'uppercase',
  },
}
