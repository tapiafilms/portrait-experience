import { useState, useEffect, useRef } from 'react'

const BASE = import.meta.env.VITE_API_URL || ''

export default function SorteoAdmin() {
  const [eventId, setEventId] = useState('')
  const [password, setPassword] = useState('')
  const [authed, setAuthed]   = useState(false)
  const [state, setState]     = useState('inactive')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg]         = useState('')
  const pollRef = useRef(null)

  const flash = (text) => { setMsg(text); setTimeout(() => setMsg(''), 3000) }

  // Poll estado y participantes
  useEffect(() => {
    if (!authed || !eventId) return
    const poll = async () => {
      try {
        const r = await fetch(`${BASE}/api/sorteo?action=state&eventId=${eventId}`)
        const d = await r.json()
        setState(d.state || 'inactive')
      } catch {}
    }
    poll()
    pollRef.current = setInterval(poll, 3000)
    return () => clearInterval(pollRef.current)
  }, [authed, eventId])

  const activate = async () => {
    setLoading(true)
    try {
      const r = await fetch(`${BASE}/api/sorteo?action=activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, password }),
      })
      const d = await r.json()
      if (d.ok) { setState('active'); flash('✅ Sorteo activado — los invitados ven el botón') }
      else flash('❌ ' + (d.error || 'Error'))
    } finally { setLoading(false) }
  }

  const startCountdown = async () => {
    setLoading(true)
    try {
      const r = await fetch(`${BASE}/api/sorteo?action=countdown`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, password, seconds: 5 }),
      })
      const d = await r.json()
      if (d.ok) { setState('countdown'); flash('🚀 Countdown iniciado — ¡5, 4, 3, 2, 1!') }
      else flash('❌ ' + (d.error || 'Error'))
    } finally { setLoading(false) }
  }

  if (!authed) {
    return (
      <div style={s.root}>
        <div style={s.loginBox}>
          <img src="/logo-gen-ex.png" alt="" style={s.logo} />
          <h2 style={s.loginTitle}>Panel del Animador</h2>
          <p style={s.loginSub}>Ingresa el ID del evento para continuar</p>
          <input
            style={s.input}
            placeholder="ID del evento (ej: uuid del evento)"
            value={eventId}
            onChange={e => setEventId(e.target.value)}
          />
          <input
            style={s.input}
            type="password"
            placeholder="Contraseña del animador"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && eventId && password && setAuthed(true)}
          />
          <button
            style={s.loginBtn}
            onClick={() => eventId && password && setAuthed(true)}
          >
            Entrar →
          </button>
        </div>
      </div>
    )
  }

  const stateColor = {
    inactive:  '#475569',
    active:    '#22c55e',
    countdown: '#f59e0b',
    done:      '#6366f1',
  }[state] || '#475569'

  const stateLabel = {
    inactive:  'Inactivo',
    active:    'Activo — esperando inicio',
    countdown: 'Countdown en curso',
    done:      'Finalizado',
  }[state] || state

  return (
    <div style={s.root}>
      <div style={s.panel}>
        <img src="/logo-gen-ex.png" alt="" style={s.logo} />
        <h1 style={s.title}>Panel del Animador</h1>
        <p style={s.eventId}>Evento: <code style={s.code}>{eventId}</code></p>

        {/* Estado actual */}
        <div style={s.statusBox}>
          <div style={{ ...s.statusDot, background: stateColor }} />
          <span style={s.statusText}>{stateLabel}</span>
        </div>

        {msg && <div style={s.msgBox}>{msg}</div>}

        {/* Botón 1: Activar sorteo */}
        <div style={s.btnSection}>
          <p style={s.btnLabel}>PASO 1 — Cuando todos tengan la app abierta</p>
          <button
            style={{ ...s.btn, ...s.btnGreen, ...(state !== 'inactive' ? s.btnDone : {}) }}
            onClick={activate}
            disabled={loading || state !== 'inactive'}
          >
            {state === 'inactive' ? '🎯 Activar SORTEO' : '✅ Sorteo activado'}
          </button>
          <p style={s.btnHint}>
            Aparece el botón SORTEO en los teléfonos de todos los invitados.
            Diles que lo presionen y apunten la cámara a su cara.
          </p>
        </div>

        {/* Botón 2: Iniciar countdown */}
        <div style={s.btnSection}>
          <p style={s.btnLabel}>PASO 2 — Cuando todos estén listos con la selfie</p>
          <button
            style={{ ...s.btn, ...s.btnOrange, ...(state === 'inactive' || state === 'countdown' || state === 'done' ? s.btnDisabled : {}) }}
            onClick={startCountdown}
            disabled={loading || state !== 'active'}
          >
            {state === 'countdown' ? '⏱ Countdown corriendo...' : '🚀 ¡Iniciar countdown!'}
          </button>
          <p style={s.btnHint}>
            Aparece una cuenta regresiva 5, 4, 3, 2, 1 en todas las pantallas.
            Al llegar a cero se toman las fotos automáticamente.
          </p>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
        * { box-sizing: border-box; }
      `}</style>
    </div>
  )
}

const s = {
  root: {
    minHeight: '100dvh',
    background: '#050810',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: "'Inter', system-ui, sans-serif",
    padding: '24px',
    color: '#fff',
  },
  loginBox: {
    width: '100%', maxWidth: 400,
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 24, padding: '40px 32px',
  },
  logo: { height: 36, objectFit: 'contain', marginBottom: 8 },
  loginTitle: { fontSize: 22, fontWeight: 800, margin: 0, textAlign: 'center' },
  loginSub: { fontSize: 14, color: 'rgba(255,255,255,0.5)', margin: 0, textAlign: 'center' },
  input: {
    width: '100%', padding: '14px 16px',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 12, color: '#fff', fontSize: 14,
    outline: 'none',
  },
  loginBtn: {
    width: '100%', padding: '14px',
    background: 'linear-gradient(135deg, #6366f1, #a855f7)',
    border: 'none', borderRadius: 50,
    color: '#fff', fontSize: 16, fontWeight: 700,
    cursor: 'pointer',
  },
  panel: {
    width: '100%', maxWidth: 480,
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24,
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 28, padding: '40px 32px',
  },
  title: { fontSize: 24, fontWeight: 800, margin: 0, textAlign: 'center' },
  eventId: { fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: 0 },
  code: { fontSize: 11, background: 'rgba(255,255,255,0.08)', padding: '2px 8px', borderRadius: 6 },
  statusBox: {
    display: 'flex', alignItems: 'center', gap: 10,
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 50, padding: '8px 20px',
  },
  statusDot: { width: 10, height: 10, borderRadius: '50%' },
  statusText: { fontSize: 14, fontWeight: 600 },
  msgBox: {
    width: '100%', padding: '12px 16px',
    background: 'rgba(99,102,241,0.15)',
    border: '1px solid rgba(99,102,241,0.3)',
    borderRadius: 12, fontSize: 14, textAlign: 'center',
  },
  btnSection: {
    width: '100%',
    display: 'flex', flexDirection: 'column', gap: 8,
  },
  btnLabel: {
    fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
    color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase',
    margin: 0,
  },
  btn: {
    width: '100%', padding: '18px',
    border: 'none', borderRadius: 16,
    color: '#fff', fontSize: 17, fontWeight: 800,
    cursor: 'pointer', letterSpacing: '0.02em',
    transition: 'opacity 0.2s, transform 0.1s',
  },
  btnGreen: { background: 'linear-gradient(135deg, #16a34a, #22c55e)' },
  btnOrange: { background: 'linear-gradient(135deg, #d97706, #f59e0b)' },
  btnDone: { opacity: 0.5, cursor: 'default' },
  btnDisabled: { opacity: 0.3, cursor: 'not-allowed' },
  btnHint: { fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: 0, lineHeight: 1.5 },
}
