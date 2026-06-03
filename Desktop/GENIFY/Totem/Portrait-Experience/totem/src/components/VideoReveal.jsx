import { useState, useEffect, useRef, useCallback } from 'react'

// Fases: original → building → flash → reveal → celebrate → done
const PHASES = ['original', 'building', 'flash', 'reveal', 'celebrate']
const DURATIONS = { original: 2000, building: 2500, flash: 350, reveal: 1800, celebrate: 4000 }

const PHASE_LABELS = {
  original:  'ANALIZANDO IMAGEN',
  building:  'PROCESANDO CON IA',
  flash:     '',
  reveal:    'TRANSFORMACIÓN COMPLETA',
  celebrate: '✦ TU PERSONAJE ESTÁ LISTO',
}

export default function VideoReveal({ originalUrl, transformedUrl, onComplete, userName, eventName }) {
  const [phase, setPhase] = useState('original')
  const canvasRef = useRef(null)
  const confettiRef = useRef(null)
  const animRef = useRef(null)

  // Máquina de fases
  useEffect(() => {
    let timer
    const advance = (current) => {
      const idx = PHASES.indexOf(current)
      if (idx < PHASES.length - 1) {
        const next = PHASES[idx + 1]
        timer = setTimeout(() => {
          setPhase(next)
          advance(next)
        }, DURATIONS[current])
      } else {
        // celebrate → done
        timer = setTimeout(() => onComplete?.(), DURATIONS.celebrate)
      }
    }
    advance('original')
    return () => clearTimeout(timer)
  }, [onComplete])

  // Canvas de partículas (building + reveal)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width = canvas.offsetWidth
    const H = canvas.height = canvas.offsetHeight
    const CX = W / 2
    const CY = H / 2

    const COLORS = ['#a855f7', '#22d3ee', '#84cc16', '#f59e0b', '#ffffff']
    let particles = []

    if (phase === 'building') {
      // Partículas convergentes desde los bordes hacia el centro
      for (let i = 0; i < 80; i++) {
        const angle = Math.random() * Math.PI * 2
        const dist = 300 + Math.random() * 400
        particles.push({
          x: CX + Math.cos(angle) * dist,
          y: CY + Math.sin(angle) * dist,
          tx: CX + (Math.random() - 0.5) * 60,
          ty: CY + (Math.random() - 0.5) * 60,
          size: 1.5 + Math.random() * 3,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          speed: 0.015 + Math.random() * 0.025,
          progress: 0,
          alpha: 0.6 + Math.random() * 0.4,
        })
      }
    } else if (phase === 'reveal') {
      // Burst de partículas desde el centro hacia afuera
      for (let i = 0; i < 120; i++) {
        const angle = Math.random() * Math.PI * 2
        const speed = 4 + Math.random() * 8
        particles.push({
          x: CX, y: CY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 2 + Math.random() * 5,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          alpha: 1,
          decay: 0.015 + Math.random() * 0.02,
          gravity: 0.1,
        })
      }
    } else {
      ctx.clearRect(0, 0, W, H)
      return
    }

    const draw = () => {
      ctx.clearRect(0, 0, W, H)
      particles.forEach(p => {
        ctx.save()
        if (phase === 'building') {
          p.progress = Math.min(1, p.progress + p.speed)
          p.x += (p.tx - p.x) * p.speed * 2
          p.y += (p.ty - p.y) * p.speed * 2
          ctx.globalAlpha = p.alpha * (1 - p.progress * 0.3)
          ctx.fillStyle = p.color
          ctx.shadowColor = p.color
          ctx.shadowBlur = 6
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
          ctx.fill()
        } else if (phase === 'reveal') {
          p.x += p.vx
          p.y += p.vy
          p.vy += p.gravity
          p.alpha = Math.max(0, p.alpha - p.decay)
          ctx.globalAlpha = p.alpha
          ctx.fillStyle = p.color
          ctx.shadowColor = p.color
          ctx.shadowBlur = 8
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.restore()
      })
      animRef.current = requestAnimationFrame(draw)
    }
    animRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(animRef.current)
  }, [phase])

  // Confetti celebración
  useEffect(() => {
    if (phase !== 'celebrate') return
    const canvas = confettiRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width = canvas.offsetWidth
    const H = canvas.height = canvas.offsetHeight

    const COLORS = ['#a855f7','#22d3ee','#84cc16','#f59e0b','#f43f5e','#ffffff','#60a5fa']
    const pieces = Array.from({ length: 100 }, () => ({
      x: Math.random() * W,
      y: -20 - Math.random() * 200,
      w: 6 + Math.random() * 8,
      h: 3 + Math.random() * 4,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rot: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.15,
      vx: (Math.random() - 0.5) * 2,
      vy: 2 + Math.random() * 3,
      alpha: 0.8 + Math.random() * 0.2,
    }))

    const draw = () => {
      ctx.clearRect(0, 0, W, H)
      pieces.forEach(p => {
        p.x  += p.vx
        p.y  += p.vy
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
    return () => cancelAnimationFrame(animRef.current)
  }, [phase])

  const showOriginal  = phase === 'original' || phase === 'building'
  const showTransform = phase === 'reveal' || phase === 'celebrate'
  const showFlash     = phase === 'flash'

  return (
    <div style={s.root}>
      {/* Imágenes */}
      <img src={originalUrl}    alt="" style={{ ...s.img, opacity: showOriginal ? 1 : 0,    transform: `scaleX(-1) scale(${phase === 'building' ? 1.03 : 1})` }} />
      <img src={transformedUrl} alt="" style={{ ...s.img, opacity: showTransform ? 1 : 0,   transform: `scale(${phase === 'reveal' ? 1.04 : 1})`, filter: phase === 'reveal' ? 'brightness(1.15)' : 'none' }} />

      {/* Flash blanco */}
      {showFlash && <div style={s.flash} />}

      {/* Canvas de partículas */}
      <canvas ref={canvasRef} style={s.canvas} />

      {/* Canvas confetti */}
      {phase === 'celebrate' && <canvas ref={confettiRef} style={s.canvas} />}

      {/* Anillos de energía (building) */}
      {phase === 'building' && (
        <div style={s.ringsWrap}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} style={{ ...s.ring, animationDelay: `${i * 0.4}s`, borderColor: i % 2 === 0 ? '#a855f7' : '#22d3ee' }} />
          ))}
          <div style={s.centerOrb} />
        </div>
      )}

      {/* Glow burst en reveal */}
      {phase === 'reveal' && <div style={s.revealGlow} />}

      {/* Overlay oscuro en building para drama */}
      {phase === 'building' && <div style={s.buildingOverlay} />}

      {/* Header siempre visible */}
      <div style={s.header}>
        <span style={s.brand}>GENOFY</span>
        {eventName && <span style={s.eventTag}>{eventName}</span>}
      </div>

      {/* Label de fase */}
      {phase !== 'flash' && (
        <div style={{ ...s.phaseLabel, opacity: phase === 'celebrate' ? 1 : 0.9 }}>
          {PHASE_LABELS[phase]}
        </div>
      )}

      {/* Barra de progreso (original + building) */}
      {(phase === 'original' || phase === 'building') && (
        <div style={s.progressWrap}>
          <div style={{
            ...s.progressFill,
            width: phase === 'original' ? '30%' : '95%',
            transition: phase === 'building' ? `width ${DURATIONS.building * 0.9}ms ease` : 'width 1s ease',
          }} />
        </div>
      )}

      {/* Celebración: nombre + botón */}
      {phase === 'celebrate' && (
        <div style={s.celebrateInfo}>
          {userName && <p style={s.celebrateName}>{userName}</p>}
          <p style={s.celebrateSub}>Escanea el QR para descargar tu imagen</p>
        </div>
      )}
    </div>
  )
}

const s = {
  root: {
    position: 'fixed', inset: 0,
    background: '#000',
    overflow: 'hidden',
    animation: 'fadeIn 0.4s ease',
  },
  img: {
    position: 'absolute', inset: 0,
    width: '100%', height: '100%',
    objectFit: 'cover', objectPosition: 'center top',
    transition: 'opacity 0.6s ease, transform 0.6s ease, filter 0.6s ease',
  },
  flash: {
    position: 'absolute', inset: 0,
    background: '#ffffff',
    zIndex: 30,
    animation: 'flashIn 0.35s ease',
  },
  canvas: {
    position: 'absolute', inset: 0,
    width: '100%', height: '100%',
    pointerEvents: 'none', zIndex: 10,
  },
  ringsWrap: {
    position: 'absolute', inset: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 15, pointerEvents: 'none',
  },
  ring: {
    position: 'absolute',
    width: '200px', height: '200px',
    borderRadius: '50%', borderWidth: '2px', borderStyle: 'solid',
    animation: 'ringExpand 1.2s ease-out infinite',
  },
  centerOrb: {
    width: '60px', height: '60px', borderRadius: '50%',
    background: 'radial-gradient(circle, #fff 0%, #a855f7 40%, transparent 70%)',
    boxShadow: '0 0 40px #a855f7, 0 0 80px #22d3ee',
    animation: 'pulse 0.8s ease-in-out infinite',
    zIndex: 1,
  },
  revealGlow: {
    position: 'absolute', inset: 0,
    background: 'radial-gradient(ellipse at center, rgba(168,85,247,0.5) 0%, rgba(34,211,238,0.2) 40%, transparent 70%)',
    zIndex: 8,
    animation: 'fadeIn 0.5s ease',
    pointerEvents: 'none',
  },
  buildingOverlay: {
    position: 'absolute', inset: 0,
    background: 'rgba(0,0,0,0.45)',
    zIndex: 5, pointerEvents: 'none',
  },
  header: {
    position: 'absolute', top: 0, left: 0, right: 0,
    padding: '24px 28px',
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
    position: 'absolute', top: '80px', left: '50%',
    transform: 'translateX(-50%)',
    fontSize: '11px', letterSpacing: '4px', color: '#c8a96e',
    background: 'rgba(0,0,0,0.55)',
    padding: '6px 18px', borderRadius: '20px',
    border: '1px solid rgba(200,169,110,0.3)',
    zIndex: 20, whiteSpace: 'nowrap',
    transition: 'opacity 0.4s',
  },
  progressWrap: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: '3px', background: 'rgba(255,255,255,0.1)', zIndex: 20,
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #a855f7, #22d3ee, #84cc16)',
    borderRadius: '2px',
    boxShadow: '0 0 8px rgba(168,85,247,0.8)',
  },
  celebrateInfo: {
    position: 'absolute', bottom: '40px', left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
    zIndex: 20, animation: 'fadeIn 0.8s ease',
    background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
    padding: '16px 32px', borderRadius: '16px',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  celebrateName: {
    fontSize: '28px', fontWeight: 800, color: '#fff', letterSpacing: '2px',
  },
  celebrateSub: {
    fontSize: '13px', color: 'rgba(255,255,255,0.5)', letterSpacing: '2px',
  },
}
