import { useEffect, useRef } from 'react'

export default function SplashScreen() {
  const videoRef = useRef(null)

  useEffect(() => {
    // Fallback: si el video tarda más de 10s, redirigir igual
    const fallback = setTimeout(() => {
      window.location.replace('https://portrait-experience.vercel.app/admin')
    }, 10000)
    return () => clearTimeout(fallback)
  }, [])

  const handleEnded = () => {
    window.location.replace('https://portrait-experience.vercel.app/admin')
  }

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        background: '#050810',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
      }}
    >
      <video
        ref={videoRef}
        src="/logo-gen.mp4"
        autoPlay
        muted
        playsInline
        onEnded={handleEnded}
        style={{
          width: '70%',
          height: '70%',
          objectFit: 'contain',
          mixBlendMode: 'screen',
        }}
      />

      {/* Vignette — funde los bordes con el fondo */}
      <div style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        background: 'radial-gradient(ellipse at center, transparent 40%, #050810 80%)',
      }} />
    </div>
  )
}
