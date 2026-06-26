import { useEffect, useState } from 'react'

export default function SplashScreen() {
  const [phase, setPhase] = useState('in') // 'in' | 'visible' | 'out'

  useEffect(() => {
    // Fade in → hold → fade out → navigate
    const t1 = setTimeout(() => setPhase('visible'), 100)
    const t2 = setTimeout(() => setPhase('out'), 2400)
    const t3 = setTimeout(() => {
      window.location.replace('/totem')
    }, 3000)
    return () => [t1, t2, t3].forEach(clearTimeout)
  }, [])

  const opacity = phase === 'in' ? 0 : phase === 'visible' ? 1 : 0

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        background: '#050810',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 32,
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
      }}
    >
      {/* Logo */}
      <div
        style={{
          opacity,
          transform: opacity === 1 ? 'scale(1)' : 'scale(0.92)',
          transition: 'opacity 0.6s ease, transform 0.6s ease',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 24,
        }}
      >
        <img
          src="/logo-ai-portrait-experience.png"
          alt="AI Portrait Experience"
          style={{ width: 280, objectFit: 'contain' }}
        />

        {/* Animated dots */}
        <div style={{ display: 'flex', gap: 8 }}>
          {[0, 1, 2].map(i => (
            <div
              key={i}
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: 'rgba(120,160,255,0.7)',
                animation: `dotPulse 1.2s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>

        <p
          style={{
            fontSize: 11,
            letterSpacing: 4,
            color: 'rgba(255,255,255,0.3)',
            fontWeight: 600,
            textTransform: 'uppercase',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          Cargando experiencia
        </p>
      </div>

      {/* Genofy branding */}
      <div
        style={{
          position: 'absolute',
          bottom: 32,
          opacity: opacity * 0.5,
          transition: 'opacity 0.6s ease',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
        }}
      >
        <p style={{ fontSize: 9, letterSpacing: 4, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', margin: 0, fontFamily: 'system-ui, sans-serif' }}>TECNOLOGÍA</p>
        <img src="/logo-genofy-transparent.png" alt="Genofy" style={{ height: 28, objectFit: 'contain' }} />
      </div>

      <style>{`
        @keyframes dotPulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50%       { opacity: 1;   transform: scale(1.2); }
        }
      `}</style>
    </div>
  )
}
