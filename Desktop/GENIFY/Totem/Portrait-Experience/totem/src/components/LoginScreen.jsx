import { useState, useRef } from 'react'
import { useEvent } from '../context/EventContext'

const BASE = import.meta.env.VITE_API_URL || ''

export default function LoginScreen() {
  const { login } = useEvent()
  const [key, setKey] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!key.trim()) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`${BASE}/api/event/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Clave inválida')
        setLoading(false)
        return
      }

      login(data)
    } catch {
      setError('Error de conexión. Verifica el internet.')
      setLoading(false)
    }
  }

  return (
    <div style={s.root}>
      <img src="/bg-totem.png" alt="" style={s.bg} />
      <div style={s.overlay} />

      <div style={s.card}>
        <img src="/logo-gen-ex.png" alt="AI Portrait Experience" style={s.logo} />

        <p style={s.subtitle}>Ingresa la clave de tu evento</p>

        <form onSubmit={handleSubmit} style={s.form}>
          <input
            ref={inputRef}
            style={{ ...s.input, borderColor: error ? '#f87171' : 'rgba(100,160,255,0.4)' }}
            type="text"
            value={key}
            onChange={e => { setKey(e.target.value.toUpperCase()); setError(null) }}
            placeholder="CLAVE DEL EVENTO"
            autoFocus
            autoComplete="off"
            spellCheck={false}
          />

          {error && <p style={s.error}>{error}</p>}

          <button style={{ ...s.btn, opacity: loading ? 0.6 : 1 }} type="submit" disabled={loading}>
            {loading ? 'Verificando...' : 'Ingresar'}
          </button>
        </form>

        <div style={s.footer}>
          <p style={s.footerTag}>TECNOLOGÍA</p>
          <img src="/logo-genofy-transparent.png" alt="Genofy" style={s.logoGenofy} />
        </div>
      </div>
    </div>
  )
}

const s = {
  root: {
    width: '100vw', height: '100vh',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    position: 'relative', overflow: 'hidden',
  },
  bg: {
    position: 'absolute', inset: 0,
    width: '100%', height: '100%',
    objectFit: 'cover', zIndex: 0,
  },
  overlay: {
    position: 'absolute', inset: 0, zIndex: 1,
    background: 'rgba(0,5,30,0.6)',
  },
  card: {
    zIndex: 2, width: '380px',
    background: 'rgba(0,10,40,0.85)',
    border: '1.5px solid rgba(100,160,255,0.3)',
    borderRadius: '28px', padding: '40px 36px',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: '24px',
    backdropFilter: 'blur(20px)',
    boxShadow: '0 0 60px rgba(30,100,255,0.2)',
    animation: 'fadeIn 0.5s ease',
  },
  logo: {
    width: '125px', objectFit: 'contain',
  },
  subtitle: {
    fontSize: '14px', color: 'rgba(255,255,255,0.6)',
    letterSpacing: '1px', textAlign: 'center',
  },
  form: {
    width: '100%', display: 'flex',
    flexDirection: 'column', gap: '12px',
  },
  input: {
    width: '100%', padding: '16px 20px',
    fontSize: '18px', fontWeight: 700, letterSpacing: '4px',
    textAlign: 'center', textTransform: 'uppercase',
    borderRadius: '14px', border: '1.5px solid',
    background: 'rgba(255,255,255,0.06)',
    color: '#fff', outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'monospace',
  },
  error: {
    fontSize: '13px', color: '#f87171',
    textAlign: 'center', margin: 0,
  },
  btn: {
    width: '100%', padding: '16px',
    background: 'linear-gradient(135deg, #3b82f6, #6d28d9)',
    border: 'none', borderRadius: '14px',
    color: '#fff', fontSize: '15px',
    fontWeight: 800, letterSpacing: '2px',
    cursor: 'pointer', transition: 'opacity 0.2s',
    textTransform: 'uppercase',
  },
  footer: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: '2px',
  },
  footerTag: {
    fontSize: '9px', letterSpacing: '4px',
    color: 'rgba(255,255,255,0.3)', fontWeight: 600,
    textTransform: 'uppercase', margin: 0,
  },
  logoGenofy: {
    height: '28px', objectFit: 'contain',
  },
}
