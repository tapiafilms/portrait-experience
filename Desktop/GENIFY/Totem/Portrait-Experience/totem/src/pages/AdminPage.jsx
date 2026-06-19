import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { createClient } from '@supabase/supabase-js'
import * as XLSX from 'xlsx'

const BASE = import.meta.env.VITE_API_URL || ''

// ── Supabase client (solo lectura desde el dashboard) ────────────────────────
function useSupabase() {
  return useMemo(() => {
    const url = import.meta.env.VITE_SUPABASE_URL
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY
    if (!url || !key) return null
    return createClient(url, key)
  }, [])
}

// ── Parse Excel/CSV de invitados ─────────────────────────────────────────────
const COL_MAP = {
  nombre:     ['nombre', 'name', 'first name', 'primer nombre'],
  apellido:   ['apellido', 'apellidos', 'last name', 'surname'],
  cargo:      ['cargo', 'puesto', 'título', 'titulo', 'position', 'role'],
  area:       ['área', 'area', 'departamento', 'department', 'gerencia'],
  mesa:       ['mesa', 'table', 'numero de mesa', 'n° mesa'],
  compañeros: ['compañeros', 'companions', 'companeros', 'acompañantes'],
}
function norm(str) {
  return (str || '').toString().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
}
function findCol(headers, candidates) {
  return headers.find(h => candidates.some(c => norm(h).includes(norm(c)))) || null
}
function parseSheet(data) {
  const wb = XLSX.read(data, { type: 'array' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(ws, { defval: '' })
  if (!rows.length) return []
  const headers = Object.keys(rows[0])
  const cols = {}
  for (const [field, candidates] of Object.entries(COL_MAP)) cols[field] = findCol(headers, candidates)
  return rows.map((row, i) => ({
    id: i + 1,
    nombre:     (row[cols.nombre]     || '').toString().trim(),
    apellido:   (row[cols.apellido]   || '').toString().trim(),
    cargo:      (row[cols.cargo]      || '').toString().trim(),
    area:       (row[cols.area]       || '').toString().trim(),
    mesa:       parseInt(row[cols.mesa]) || 0,
    compañeros: cols.compañeros && row[cols.compañeros]
      ? row[cols.compañeros].toString().split(/[,;|]/).map(s => s.trim()).filter(Boolean)
      : [],
  })).filter(g => g.nombre)
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function AdminPage() {
  const [password, setPassword] = useState('')
  const [authed, setAuthed]     = useState(false)
  const [authError, setAuthError] = useState(false)

  const [events, setEvents]         = useState([])
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [tab, setTab]               = useState('resumen')

  const supabase = useSupabase()

  // ── Login ────────────────────────────────────────────────────────────────────
  const checkAuth = async () => {
    if (!password.trim()) return setAuthError(true)
    try {
      const r = await fetch(`${BASE}/api/admin/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (r.status === 401) return setAuthError(true)
      setAuthed(true)
    } catch {
      setAuthError(true)
    }
  }

  // ── Cargar lista de eventos ───────────────────────────────────────────────
  useEffect(() => {
    if (!authed || !supabase) return
    supabase.from('events').select('id, event_name, key, active, expires_at, created_at')
      .order('created_at', { ascending: false })
      .then(({ data }) => { if (data?.length) { setEvents(data); setSelectedEvent(data[0]) } })
  }, [authed])

  if (!authed) return <Login password={password} setPassword={setPassword} authError={authError} onLogin={checkAuth} />

  return (
    <div style={s.root}>
      {/* Sidebar */}
      <aside style={s.sidebar}>
        <img src="/logo-genofy-transparent.png" alt="Genofy" style={s.logo} />

        {/* Selector de evento */}
        <div style={s.eventSelector}>
          <p style={s.sideLabel}>Evento activo</p>
          <select
            style={s.select}
            value={selectedEvent?.id || ''}
            onChange={e => setSelectedEvent(events.find(ev => ev.id === e.target.value) || null)}
          >
            {events.map(ev => (
              <option key={ev.id} value={ev.id}>{ev.event_name}</option>
            ))}
          </select>
        </div>

        {/* Nav tabs */}
        <nav style={s.nav}>
          {[
            { id: 'resumen',   label: 'Resumen',         icon: '📊' },
            { id: 'momentos',  label: 'Momentos',        icon: '🎯' },
            { id: 'pantalla',  label: 'Pantalla gigante', icon: '🖥️' },
            { id: 'invitados', label: 'Invitados',       icon: '👥' },
            { id: 'crear',     label: 'Crear evento',    icon: '➕' },
          ].map(t => (
            <button
              key={t.id}
              style={{ ...s.navBtn, ...(tab === t.id ? s.navBtnActive : {}) }}
              onClick={() => setTab(t.id)}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </nav>

        <button style={s.logoutBtn} onClick={() => { setAuthed(false); setPassword('') }}>
          Salir
        </button>
      </aside>

      {/* Contenido principal */}
      <main style={s.main}>
        {!selectedEvent && tab !== 'crear' ? (
          <div style={s.empty}>
            <p style={s.emptyText}>No hay eventos. Crea uno en la sección ➕</p>
            <button style={s.emptyBtn} onClick={() => setTab('crear')}>Crear evento →</button>
          </div>
        ) : (
          <>
            {tab === 'resumen'   && <TabResumen   event={selectedEvent} supabase={supabase} />}
            {tab === 'momentos'  && <TabMomentos  event={selectedEvent} password={password} />}
            {tab === 'pantalla'  && <TabPantalla  event={selectedEvent} />}
            {tab === 'invitados' && <TabInvitados event={selectedEvent} />}
            {tab === 'crear'     && <TabCrear     password={password} supabase={supabase} onCreated={ev => { setEvents(prev => [ev, ...prev]); setSelectedEvent(ev); setTab('resumen') }} />}
          </>
        )}
      </main>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// Login
// ═══════════════════════════════════════════════════════════════════════════════
function Login({ password, setPassword, authError, onLogin }) {
  return (
    <div style={s.loginRoot}>
      <div style={s.loginCard}>
        <img src="/logo-genofy-transparent.png" alt="Genofy" style={{ height: 40, marginBottom: 8 }} />
        <p style={s.loginTitle}>Dashboard del Operador</p>
        <input
          style={s.input}
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && onLogin()}
          autoFocus
        />
        {authError && <p style={s.errorText}>Contraseña incorrecta</p>}
        <button style={s.primaryBtn} onClick={onLogin}>Entrar →</button>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// Tab: Resumen
// ═══════════════════════════════════════════════════════════════════════════════
function TabResumen({ event, supabase }) {
  const [metrics, setMetrics] = useState({ photos: 0, sorteoTotal: 0, sorteoPaired: 0, sorteoConfirmed: 0 })
  const [sorteoState, setSorteoState] = useState('inactive')

  const load = useCallback(async () => {
    if (!event?.id || !supabase) return
    const [photos, participants, sorteo] = await Promise.all([
      supabase.from('event_photos').select('id', { count: 'exact', head: true }).eq('event_id', event.id),
      supabase.from('sorteo_participants').select('paired_session_id, confirmed_at').eq('event_id', event.id),
      supabase.from('sorteo_events').select('state').eq('event_id', event.id).single(),
    ])
    const p = participants.data || []
    setMetrics({
      photos:           photos.count || 0,
      sorteoTotal:      p.length,
      sorteoPaired:     p.filter(r => r.paired_session_id).length,
      sorteoConfirmed:  p.filter(r => r.confirmed_at).length,
    })
    setSorteoState(sorteo.data?.state || 'inactive')
  }, [event?.id])

  useEffect(() => { load(); const t = setInterval(load, 5000); return () => clearInterval(t) }, [load])

  const sorteoStateLabel = { inactive: 'Inactivo', active: 'Activo', countdown: 'Countdown', done: 'Finalizado' }
  const sorteoStateColor = { inactive: '#475569', active: '#22c55e', countdown: '#f59e0b', done: '#6366f1' }

  return (
    <div style={s.tabWrap}>
      <h2 style={s.tabTitle}>Resumen — {event?.event_name}</h2>
      <p style={s.tabSub}>Clave del tótem: <code style={s.code}>{event?.key}</code></p>

      <div style={s.metricsGrid}>
        <MetricCard label="Fotos en pantalla gigante" value={metrics.photos} color="#22d3ee" icon="📸" />
        <MetricCard label="Participantes en sorteo"   value={metrics.sorteoTotal} color="#a855f7" icon="🎯" />
        <MetricCard label="Parejas formadas"          value={metrics.sorteoPaired / 2 | 0} color="#f59e0b" icon="💑" />
        <MetricCard label="Encuentros confirmados"    value={metrics.sorteoConfirmed / 2 | 0} color="#22c55e" icon="🏆" />
      </div>

      <div style={s.statusRow}>
        <span style={s.statusLabel}>Estado del sorteo:</span>
        <span style={{ ...s.statusBadge, background: sorteoStateColor[sorteoState] + '22', color: sorteoStateColor[sorteoState], border: `1px solid ${sorteoStateColor[sorteoState]}55` }}>
          {sorteoStateLabel[sorteoState] || sorteoState}
        </span>
      </div>

      <div style={s.infoBox}>
        <p style={s.infoText}>URL de la galería (pantalla gigante):</p>
        <code style={s.codeBlock}>{window.location.origin}/galeria/{event?.id}</code>
        <button style={s.copyBtn} onClick={() => navigator.clipboard.writeText(`${window.location.origin}/galeria/${event?.id}`)}>
          Copiar
        </button>
      </div>
    </div>
  )
}

function MetricCard({ label, value, color, icon }) {
  return (
    <div style={{ ...s.metricCard, borderColor: color + '33' }}>
      <span style={{ fontSize: 28 }}>{icon}</span>
      <span style={{ ...s.metricValue, color }}>{value}</span>
      <span style={s.metricLabel}>{label}</span>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// Tab: Momentos
// ═══════════════════════════════════════════════════════════════════════════════
function TabMomentos({ event, password }) {
  const [sorteoState, setSorteoState] = useState('inactive')
  const [loading, setLoading]         = useState(false)
  const [msg, setMsg]                 = useState('')

  const flash = (text) => { setMsg(text); setTimeout(() => setMsg(''), 4000) }

  useEffect(() => {
    if (!event?.id) return
    const poll = async () => {
      const r = await fetch(`${BASE}/api/sorteo?action=state&eventId=${event.id}`)
      const d = await r.json()
      setSorteoState(d.state || 'inactive')
    }
    poll()
    const t = setInterval(poll, 3000)
    return () => clearInterval(t)
  }, [event?.id])

  const activateSorteo = async () => {
    setLoading(true)
    try {
      const r = await fetch(`${BASE}/api/sorteo?action=activate`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: event.id, password }),
      })
      const d = await r.json()
      if (d.ok) { setSorteoState('active'); flash('✅ Sorteo activado — el botón aparece en todos los teléfonos') }
      else flash('❌ ' + (d.error || 'Error'))
    } finally { setLoading(false) }
  }

  const startCountdown = async () => {
    setLoading(true)
    try {
      const r = await fetch(`${BASE}/api/sorteo?action=countdown`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: event.id, password, seconds: 5 }),
      })
      const d = await r.json()
      if (d.ok) { setSorteoState('countdown'); flash('🚀 Countdown iniciado — 5, 4, 3, 2, 1 en todos los teléfonos') }
      else flash('❌ ' + (d.error || 'Error'))
    } finally { setLoading(false) }
  }

  const stateColor = { inactive: '#475569', active: '#22c55e', countdown: '#f59e0b', done: '#6366f1' }
  const stateLabel = { inactive: 'Inactivo', active: 'Activo — esperando inicio', countdown: 'Countdown en curso', done: 'Finalizado' }

  return (
    <div style={s.tabWrap}>
      <h2 style={s.tabTitle}>Control de Momentos</h2>

      {msg && <div style={s.msgBox}>{msg}</div>}

      {/* Momento 3 — Sorteo */}
      <div style={s.momentCard}>
        <div style={s.momentHeader}>
          <span style={s.momentIcon}>🎯</span>
          <div>
            <p style={s.momentTitle}>Momento 3 — Sorteo</p>
            <div style={s.momentStateRow}>
              <div style={{ ...s.stateDot, background: stateColor[sorteoState] || '#475569' }} />
              <span style={s.momentState}>{stateLabel[sorteoState] || sorteoState}</span>
            </div>
          </div>
        </div>

        <div style={s.momentSteps}>
          <div style={s.step}>
            <p style={s.stepNum}>PASO 1</p>
            <p style={s.stepDesc}>Activa el botón SORTEO en los teléfonos de todos los invitados. Luego avísale al animador para que les diga que lo presionen.</p>
            <button
              style={{ ...s.stepBtn, background: sorteoState === 'inactive' ? 'linear-gradient(135deg,#16a34a,#22c55e)' : 'rgba(255,255,255,0.06)', opacity: loading ? 0.6 : 1 }}
              onClick={activateSorteo}
              disabled={loading || sorteoState !== 'inactive'}
            >
              {sorteoState === 'inactive' ? '🟢 Activar SORTEO' : '✅ Sorteo activado'}
            </button>
          </div>

          <div style={s.stepDivider} />

          <div style={s.step}>
            <p style={s.stepNum}>PASO 2</p>
            <p style={s.stepDesc}>Cuando el animador te dé la señal (todos con la cámara lista), dispara el countdown. Aparecerá 5, 4, 3, 2, 1 en todos los teléfonos simultáneamente.</p>
            <button
              style={{ ...s.stepBtn, background: sorteoState === 'active' ? 'linear-gradient(135deg,#d97706,#f59e0b)' : 'rgba(255,255,255,0.06)', opacity: (loading || sorteoState !== 'active') ? 0.4 : 1 }}
              onClick={startCountdown}
              disabled={loading || sorteoState !== 'active'}
            >
              {sorteoState === 'countdown' ? '⏱ Countdown corriendo...' : '🚀 Disparar countdown'}
            </button>
          </div>
        </div>
      </div>

      <div style={s.comingSoon}>
        <p style={s.comingSoonText}>Momento 1 y 2 no requieren activación manual — funcionan de forma continua.</p>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// Tab: Pantalla gigante
// ═══════════════════════════════════════════════════════════════════════════════
function TabPantalla({ event }) {
  const url = event ? `${window.location.origin}/galeria/${event.id}` : null

  return (
    <div style={s.tabWrap}>
      <h2 style={s.tabTitle}>Monitor — Pantalla Gigante</h2>
      {url && (
        <>
          <div style={s.pantallaToolbar}>
            <code style={s.codeSmall}>{url}</code>
            <a href={url} target="_blank" rel="noreferrer" style={s.openBtn}>Abrir en pestaña ↗</a>
          </div>
          <div style={s.iframeWrap}>
            <iframe
              src={url}
              title="Pantalla gigante"
              style={s.iframe}
              allow="autoplay"
            />
          </div>
          <p style={s.pantallaHint}>Este es el preview de lo que se está mostrando en la pantalla del evento.</p>
        </>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// Tab: Invitados
// ═══════════════════════════════════════════════════════════════════════════════
function TabInvitados({ event }) {
  const guests = event?.guests || []
  const [search, setSearch] = useState('')
  const filtered = guests.filter(g =>
    `${g.nombre} ${g.apellido} ${g.cargo} ${g.area}`.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={s.tabWrap}>
      <h2 style={s.tabTitle}>Invitados — {event?.event_name}</h2>
      <p style={s.tabSub}>{guests.length} invitados registrados</p>

      <input
        style={{ ...s.input, marginBottom: 16 }}
        placeholder="Buscar por nombre, cargo, área..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      {guests.length === 0 ? (
        <p style={s.emptyText}>Este evento no tiene lista de invitados cargada.</p>
      ) : (
        <div style={s.guestTable}>
          <div style={s.guestHeader}>
            {['#', 'Nombre', 'Apellido', 'Cargo', 'Área', 'Mesa'].map(h => (
              <span key={h} style={s.th}>{h}</span>
            ))}
          </div>
          {filtered.slice(0, 100).map(g => (
            <div key={g.id} style={s.guestRow}>
              <span style={s.td}>{g.id}</span>
              <span style={s.td}>{g.nombre}</span>
              <span style={s.td}>{g.apellido}</span>
              <span style={s.td}>{g.cargo}</span>
              <span style={s.td}>{g.area}</span>
              <span style={s.td}>{g.mesa || '—'}</span>
            </div>
          ))}
          {filtered.length > 100 && (
            <p style={{ fontSize: 12, color: '#555', textAlign: 'center', padding: 8 }}>
              Mostrando 100 de {filtered.length} resultados
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// Tab: Crear evento
// ═══════════════════════════════════════════════════════════════════════════════
function TabCrear({ password, onCreated }) {
  const [eventName, setEventName] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [guests, setGuests]       = useState([])
  const [fileName, setFileName]   = useState(null)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState(null)
  const [result, setResult]       = useState(null)
  const fileRef = useRef(null)

  function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    setFileName(file.name); setError(null)
    const reader = new FileReader()
    reader.onload = ev => {
      try { setGuests(parseSheet(new Uint8Array(ev.target.result))) }
      catch { setError('No se pudo leer el archivo. Usa .xlsx o .csv') }
    }
    reader.readAsArrayBuffer(file)
  }

  async function handleCreate() {
    if (!eventName.trim()) return setError('Ingresa el nombre del evento')
    if (!guests.length) return setError('Carga la lista de invitados primero')
    setLoading(true); setError(null)
    try {
      const r = await fetch(`${BASE}/api/admin/create-event`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, eventName, guests, expiresAt: expiresAt || null }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error)
      setResult(data)
      onCreated({ id: data.eventId, event_name: eventName, key: data.key, guests, active: true })
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  if (result) return (
    <div style={s.tabWrap}>
      <h2 style={s.tabTitle}>Evento creado ✅</h2>
      <div style={s.resultBox}>
        <p style={s.resultName}>{eventName}</p>
        <p style={s.resultKeyLabel}>Clave del tótem</p>
        <p style={s.resultKey}>{result.key}</p>
        <p style={s.resultSub}>Ingresa esta clave en el tótem para activar el evento</p>
        <button style={s.copyBtn} onClick={() => navigator.clipboard.writeText(result.key)}>Copiar clave</button>
        <button style={s.secondaryBtn} onClick={() => { setResult(null); setGuests([]); setFileName(null); setEventName(''); setExpiresAt('') }}>
          Crear otro evento
        </button>
      </div>
    </div>
  )

  return (
    <div style={s.tabWrap}>
      <h2 style={s.tabTitle}>Crear nuevo evento</h2>

      <div style={s.field}>
        <label style={s.fieldLabel}>Nombre del evento</label>
        <input style={s.input} placeholder="Ej: Gala Anual Empresa 2025" value={eventName} onChange={e => setEventName(e.target.value)} />
      </div>

      <div style={s.field}>
        <label style={s.fieldLabel}>Expira el (opcional)</label>
        <input style={s.input} type="datetime-local" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} />
      </div>

      <div style={s.field}>
        <label style={s.fieldLabel}>Lista de invitados (.xlsx o .csv)</label>
        <div style={s.uploadZone} onClick={() => fileRef.current?.click()}>
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }} onChange={handleFile} />
          <p style={s.uploadText}>{fileName ? `📄 ${fileName} — ${guests.length} invitados` : '📂 Click para subir Excel o CSV'}</p>
        </div>
        <p style={s.hint}>Columnas: nombre, apellido, cargo, area, mesa, compañeros (español o inglés)</p>
      </div>

      {guests.length > 0 && (
        <div style={s.guestTable}>
          <div style={s.guestHeader}>
            {['#', 'Nombre', 'Apellido', 'Cargo', 'Mesa'].map(h => <span key={h} style={s.th}>{h}</span>)}
          </div>
          {guests.slice(0, 5).map(g => (
            <div key={g.id} style={s.guestRow}>
              <span style={s.td}>{g.id}</span>
              <span style={s.td}>{g.nombre}</span>
              <span style={s.td}>{g.apellido}</span>
              <span style={s.td}>{g.cargo}</span>
              <span style={s.td}>{g.mesa}</span>
            </div>
          ))}
          {guests.length > 5 && <p style={{ fontSize: 12, color: '#555', textAlign: 'center', padding: 8 }}>...y {guests.length - 5} más</p>}
        </div>
      )}

      {error && <p style={s.errorText}>{error}</p>}

      <button style={{ ...s.primaryBtn, opacity: loading ? 0.6 : 1 }} onClick={handleCreate} disabled={loading}>
        {loading ? 'Creando evento...' : 'Crear evento →'}
      </button>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// Estilos
// ═══════════════════════════════════════════════════════════════════════════════
const s = {
  // Layout
  root: {
    display: 'flex', minHeight: '100dvh',
    background: '#07090f', fontFamily: "'Inter', system-ui, sans-serif",
    color: '#fff',
  },
  sidebar: {
    width: 240, flexShrink: 0,
    background: '#0d1117',
    borderRight: '1px solid rgba(255,255,255,0.06)',
    display: 'flex', flexDirection: 'column',
    padding: '28px 16px', gap: 24,
  },
  logo: { height: 28, objectFit: 'contain', alignSelf: 'flex-start', marginLeft: 8 },
  eventSelector: { display: 'flex', flexDirection: 'column', gap: 6 },
  sideLabel: { fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 },
  select: {
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8, color: '#fff', padding: '8px 10px', fontSize: 13,
    outline: 'none', cursor: 'pointer', width: '100%',
  },
  nav: { display: 'flex', flexDirection: 'column', gap: 4, flex: 1 },
  navBtn: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '10px 12px', borderRadius: 10,
    background: 'transparent', border: 'none',
    color: 'rgba(255,255,255,0.4)', fontSize: 14, fontWeight: 500,
    cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
  },
  navBtnActive: {
    background: 'rgba(99,102,241,0.15)',
    color: '#fff',
    border: '1px solid rgba(99,102,241,0.3)',
  },
  logoutBtn: {
    padding: '8px 12px', background: 'transparent',
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
    color: 'rgba(255,255,255,0.3)', fontSize: 12, cursor: 'pointer',
  },
  main: { flex: 1, overflow: 'auto', padding: '40px 48px' },

  // Login
  loginRoot: {
    minHeight: '100dvh', background: '#07090f',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: "'Inter', system-ui, sans-serif",
  },
  loginCard: {
    width: '100%', maxWidth: 360,
    background: '#0d1117', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 20, padding: '40px 32px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
  },
  loginTitle: { fontSize: 18, fontWeight: 800, color: '#fff', margin: 0 },

  // Tabs
  tabWrap: { display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 860 },
  tabTitle: { fontSize: 22, fontWeight: 800, color: '#fff', margin: 0 },
  tabSub: { fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: '-16px 0 0' },

  // Metrics
  metricsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 },
  metricCard: {
    background: 'rgba(255,255,255,0.03)', border: '1px solid',
    borderRadius: 16, padding: '20px 16px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
  },
  metricValue: { fontSize: 40, fontWeight: 900, lineHeight: 1 },
  metricLabel: { fontSize: 12, color: 'rgba(255,255,255,0.4)', textAlign: 'center' },
  statusRow: { display: 'flex', alignItems: 'center', gap: 12 },
  statusLabel: { fontSize: 13, color: 'rgba(255,255,255,0.5)' },
  statusBadge: { fontSize: 12, fontWeight: 700, padding: '4px 14px', borderRadius: 50, letterSpacing: '0.05em' },
  infoBox: {
    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 12, padding: '16px 20px',
    display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
  },
  infoText: { fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: 0 },
  codeBlock: { fontSize: 13, color: '#22d3ee', flex: 1 },

  // Momentos
  momentCard: {
    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 20, padding: '28px',
  },
  momentHeader: { display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 },
  momentIcon: { fontSize: 36 },
  momentTitle: { fontSize: 18, fontWeight: 800, margin: 0 },
  momentStateRow: { display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 },
  stateDot: { width: 8, height: 8, borderRadius: '50%' },
  momentState: { fontSize: 13, color: 'rgba(255,255,255,0.5)' },
  momentSteps: { display: 'flex', flexDirection: 'column', gap: 0 },
  step: { display: 'flex', flexDirection: 'column', gap: 8 },
  stepDivider: { height: 1, background: 'rgba(255,255,255,0.06)', margin: '20px 0' },
  stepNum: { fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.15em', margin: 0 },
  stepDesc: { fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5, margin: 0 },
  stepBtn: {
    alignSelf: 'flex-start', padding: '12px 28px',
    border: 'none', borderRadius: 50, color: '#fff',
    fontSize: 15, fontWeight: 800, cursor: 'pointer',
    transition: 'opacity 0.2s',
  },
  comingSoon: {
    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 12, padding: '14px 20px',
  },
  comingSoonText: { fontSize: 13, color: 'rgba(255,255,255,0.25)', margin: 0 },

  // Pantalla
  pantallaToolbar: {
    display: 'flex', alignItems: 'center', gap: 12,
    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 10, padding: '10px 16px',
  },
  codeSmall: { fontSize: 12, color: '#22d3ee', flex: 1 },
  openBtn: {
    padding: '6px 16px', background: 'rgba(34,211,238,0.1)',
    border: '1px solid rgba(34,211,238,0.3)',
    borderRadius: 6, color: '#22d3ee', fontSize: 12,
    textDecoration: 'none', fontWeight: 600, whiteSpace: 'nowrap',
  },
  iframeWrap: {
    width: '100%', aspectRatio: '16/9',
    borderRadius: 16, overflow: 'hidden',
    border: '1px solid rgba(255,255,255,0.08)',
    background: '#000',
  },
  iframe: { width: '100%', height: '100%', border: 'none' },
  pantallaHint: { fontSize: 12, color: 'rgba(255,255,255,0.25)', margin: 0 },

  // Tabla invitados
  guestTable: { border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, overflow: 'hidden' },
  guestHeader: {
    display: 'grid', gridTemplateColumns: '40px 1fr 1fr 1.5fr 1.5fr 60px',
    background: 'rgba(255,255,255,0.04)', padding: '10px 14px', gap: 8,
  },
  guestRow: {
    display: 'grid', gridTemplateColumns: '40px 1fr 1fr 1.5fr 1.5fr 60px',
    padding: '9px 14px', gap: 8,
    borderTop: '1px solid rgba(255,255,255,0.04)',
  },
  th: { fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.05em' },
  td: { fontSize: 13, color: 'rgba(255,255,255,0.7)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },

  // Crear evento
  field: { display: 'flex', flexDirection: 'column', gap: 8 },
  fieldLabel: { fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase' },
  uploadZone: {
    border: '2px dashed rgba(255,255,255,0.12)', borderRadius: 12,
    padding: 20, textAlign: 'center', cursor: 'pointer',
  },
  uploadText: { color: 'rgba(255,255,255,0.4)', margin: 0, fontSize: 14 },
  hint: { fontSize: 12, color: 'rgba(255,255,255,0.25)', margin: 0, lineHeight: 1.6 },
  resultBox: {
    background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.2)',
    borderRadius: 16, padding: '32px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
  },
  resultName: { fontSize: 14, color: 'rgba(255,255,255,0.5)', margin: 0 },
  resultKeyLabel: { fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 },
  resultKey: { fontSize: 36, fontWeight: 900, letterSpacing: '6px', fontFamily: 'monospace', margin: 0 },
  resultSub: { fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: 0 },

  // Empty state
  empty: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 16 },
  emptyText: { fontSize: 16, color: 'rgba(255,255,255,0.3)' },
  emptyBtn: { padding: '12px 28px', background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)', borderRadius: 50, color: '#a5b4fc', fontSize: 14, fontWeight: 700, cursor: 'pointer' },

  // Shared
  input: {
    padding: '12px 16px', fontSize: 14,
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10, color: '#fff', outline: 'none', width: '100%', boxSizing: 'border-box',
  },
  primaryBtn: {
    padding: '14px', background: 'linear-gradient(135deg,#6366f1,#a855f7)',
    border: 'none', borderRadius: 12, color: '#fff',
    fontSize: 15, fontWeight: 700, cursor: 'pointer',
  },
  secondaryBtn: {
    padding: '10px 20px', background: 'transparent',
    border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10,
    color: 'rgba(255,255,255,0.5)', fontSize: 13, cursor: 'pointer',
  },
  copyBtn: {
    padding: '10px 24px', background: 'rgba(34,197,94,0.15)',
    border: '1px solid rgba(34,197,94,0.3)', borderRadius: 8,
    color: '#4ade80', fontSize: 13, fontWeight: 700, cursor: 'pointer',
  },
  msgBox: {
    padding: '12px 16px', background: 'rgba(99,102,241,0.1)',
    border: '1px solid rgba(99,102,241,0.3)', borderRadius: 10,
    fontSize: 14, textAlign: 'center',
  },
  errorText: { color: '#f87171', fontSize: 13, margin: 0 },
  code: { fontSize: 12, background: 'rgba(255,255,255,0.08)', padding: '2px 8px', borderRadius: 6, fontFamily: 'monospace' },
}
