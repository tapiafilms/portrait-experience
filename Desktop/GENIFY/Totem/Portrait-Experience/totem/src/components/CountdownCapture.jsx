import { useState, useEffect, useRef } from 'react'

export default function CountdownCapture({ onCapture, seconds = 3 }) {
  const [count, setCount] = useState(seconds)
  const [flash, setFlash] = useState(false)
  // Guardamos onCapture en ref para que el timer nunca se reinicie
  // aunque el prop cambie entre renders
  const onCaptureRef = useRef(onCapture)
  useEffect(() => { onCaptureRef.current = onCapture }, [onCapture])

  useEffect(() => {
    if (count === 0) {
      setFlash(true)
      const t = setTimeout(() => {
        setFlash(false)
        onCaptureRef.current()
      }, 300)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => setCount(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [count]) // solo depende de count — no de onCapture

  return (
    <>
      {flash && <div style={styles.flash} />}

      <div style={styles.root}>
        <p style={styles.label}>Preparate...</p>
        <div style={styles.numberWrap} key={count}>
          <span style={styles.number}>{count > 0 ? count : '📸'}</span>
        </div>
        <div style={styles.progress}>
          {Array.from({ length: seconds }).map((_, i) => (
            <div
              key={i}
              style={{
                ...styles.dot,
                background: i < seconds - count ? '#c8a96e' : 'rgba(255,255,255,0.2)',
              }}
            />
          ))}
        </div>
      </div>
    </>
  )
}

const styles = {
  root: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(0,0,0,0.5)',
    gap: '24px',
    zIndex: 10,
  },
  label: {
    fontSize: '18px',
    letterSpacing: '4px',
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
  },
  numberWrap: {
    animation: 'countdownPop 0.4s ease',
  },
  number: {
    fontSize: '140px',
    fontWeight: 800,
    color: '#c8a96e',
    textShadow: '0 0 60px rgba(200,169,110,0.6)',
    lineHeight: 1,
  },
  progress: {
    display: 'flex',
    gap: '10px',
  },
  dot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    transition: 'background 0.3s ease',
  },
  flash: {
    position: 'fixed',
    inset: 0,
    background: '#ffffff',
    zIndex: 100,
    pointerEvents: 'none',
    animation: 'fadeIn 0.05s ease',
  },
}
