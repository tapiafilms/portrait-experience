import { useState, useRef } from 'react'
import * as XLSX from 'xlsx'

const BASE = import.meta.env.VITE_API_URL || ''

// Columnas que acepta el sistema (flexible con nombres del cliente)
const COL_MAP = {
  nombre:    ['nombre', 'name', 'first name', 'primer nombre'],
  apellido:  ['apellido', 'apellidos', 'last name', 'surname'],
  cargo:     ['cargo', 'puesto', 'título', 'titulo', 'position', 'role'],
  area:      ['área', 'area', 'departamento', 'department', 'gerencia'],
  mesa:      ['mesa', 'table', 'numero de mesa', 'n° mesa'],
  compañeros:['compañeros', 'companions', 'companeros', 'acompañantes'],
}

function normalize(str) {
  return (str || '').toString().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
}

function findCol(headers, candidates) {
  return headers.find(h => candidates.some(c => normalize(h).includes(normalize(c)))) || null
}

function parseSheet(data) {
  const wb = XLSX.read(data, { type: 'array' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(ws, { defval: '' })
  if (!rows.length) return []

  const headers = Object.keys(rows[0])
  const cols = {}
  for (const [field, candidates] of Object.entries(COL_MAP)) {
    cols[field] = findCol(headers, candidates)
  }

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

export default function AdminPage() {
  const [authed, setAuthed]     = useState(false)
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState(false)

  const [guests, setGuests]     = useState([])
  const [fileName, setFileName] = useState(null)
  const [eventName, setEventName] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [loading, setLoading]   = useState(false)
  const [result, setResult]     = useState(null)
  const [error, setError]       = useState(null)
  const fileRef = useRef(null)

  // ── Login ────────────────────────────────────────────────────────────────
  if (!authed) return (
    <div style={s.root}>
      <div style={s.card}>
        <img src="/logo-genofy-transparent.png" alt="Genofy" style={{ height: 40, marginBottom: 24 }} />
        <p style={s.title}>Panel Admin</p>
        <input
          style={s.input}
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={e => { setPassword(e.target.value); setAuthError(false) }}
          onKeyDown={e => e.key === 'Enter' && checkAuth()}
          autoFocus
        />
        {authError && <p style={s.error}>Contraseña incorrecta</p>}
        <button style={s.btn} onClick={checkAuth}>Entrar</button>
      </div>
    </div>
  )

  function checkAuth() {
    // Verificación local simple — la contraseña real la valida el servidor al crear
    if (password.trim()) { setAuthed(true) } else setAuthError(true)
  }

  // ── Cargar archivo ───────────────────────────────────────────────────────
  function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    setFileName(file.name)
    setResult(null)
    setError(null)

    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const parsed = parseSheet(new Uint8Array(ev.target.result))
        setGuests(parsed)
      } catch (err) {
        setError('No se pudo leer el archivo. Asegúrate que sea Excel (.xlsx) o CSV.')
      }
    }
    reader.readAsArrayBuffer(file)
  }

  // ── Crear evento ─────────────────────────────────────────────────────────
  async function handleCreate() {
    if (!eventName.trim()) return setError('Ingresa el nombre del evento')
    if (!guests.length) return setError('Carga la lista de invitados primero')
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`${BASE}/api/admin/create-event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, eventName, guests, expiresAt: expiresAt || null }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ── UI principal ─────────────────────────────────────────────────────────
  return (
    <div style={s.root}>
      <div style={{ ...s.card, maxWidth: 700, width: '90%' }}>
        <div style={s.header}>
          <img src="/logo-genofy-transparent.png" alt="Genofy" style={{ height: 32 }} />
          <p style={s.title}>Crear Evento</p>
        </div>

        {/* Nombre del evento */}
        <div style={s.section}>
          <label style={s.label}>Nombre del evento</label>
          <input
            style={s.input}
            placeholder="Ej: Gala Anual 2025"
            value={eventName}
            onChange={e => setEventName(e.target.value)}
          />
        </div>

        {/* Fecha de expiración */}
        <div style={s.section}>
          <label style={s.label}>Expira el (opcional — por defecto mañana)</label>
          <input
            style={s.input}
            type="datetime-local"
            value={expiresAt}
            onChange={e => setExpiresAt(e.target.value)}
          />
        </div>

        {/* Upload Excel */}
        <div style={s.section}>
          <label style={s.label}>Lista de invitados (.xlsx o .csv)</label>
          <div style={s.uploadZone} onClick={() => fileRef.current?.click()}>
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }} onChange={handleFile} />
            {fileName
              ? <p style={s.uploadText}>📄 {fileName} — {guests.length} invitados cargados</p>
              : <p style={s.uploadText}>📂 Click para subir Excel o CSV</p>
            }
          </div>
          <p style={s.hint}>
            Columnas esperadas: <strong>nombre, apellido, cargo, area, mesa, compañeros</strong>
            <br />Los nombres de columnas pueden estar en inglés o español.
          </p>
        </div>

        {/* Preview invitados */}
        {guests.length > 0 && (
          <div style={s.section}>
            <label style={s.label}>Preview — {guests.length} invitados</label>
            <div style={s.table}>
              <div style={s.tableHeader}>
                {['#', 'Nombre', 'Apellido', 'Cargo', 'Mesa'].map(h => (
                  <span key={h} style={s.th}>{h}</span>
                ))}
              </div>
              {guests.slice(0, 5).map(g => (
                <div key={g.id} style={s.tableRow}>
                  <span style={s.td}>{g.id}</span>
                  <span style={s.td}>{g.nombre}</span>
                  <span style={s.td}>{g.apellido}</span>
                  <span style={s.td}>{g.cargo}</span>
                  <span style={s.td}>{g.mesa}</span>
                </div>
              ))}
              {guests.length > 5 && (
                <p style={{ fontSize: 12, color: '#888', margin: '8px 0 0', textAlign: 'center' }}>
                  ...y {guests.length - 5} más
                </p>
              )}
            </div>
          </div>
        )}

        {error && <p style={s.error}>{error}</p>}

        {/* Resultado */}
        {result ? (
          <div style={s.resultBox}>
            <p style={s.resultTitle}>✅ Evento creado</p>
            <p style={s.resultKey}>{result.key}</p>
            <p style={s.resultSub}>Entrega esta clave al operador del tótem</p>
            <button style={s.copyBtn} onClick={() => navigator.clipboard.writeText(result.key)}>
              Copiar clave
            </button>
            <button style={{ ...s.btn, marginTop: 8, background: 'transparent', border: '1px solid #555', color: '#aaa' }}
              onClick={() => { setResult(null); setGuests([]); setFileName(null); setEventName(''); setExpiresAt('') }}>
              Crear otro evento
            </button>
          </div>
        ) : (
          <button
            style={{ ...s.btn, opacity: loading ? 0.6 : 1 }}
            onClick={handleCreate}
            disabled={loading}
          >
            {loading ? 'Creando...' : 'Crear evento y generar clave'}
          </button>
        )}
      </div>
    </div>
  )
}

const s = {
  root: {
    minHeight: '100vh', background: '#0a0a0a',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 24, fontFamily: 'system-ui, sans-serif',
  },
  card: {
    background: '#141414', border: '1px solid #222',
    borderRadius: 20, padding: '36px 32px',
    display: 'flex', flexDirection: 'column', gap: 20,
  },
  header: {
    display: 'flex', alignItems: 'center', gap: 16,
  },
  title: {
    fontSize: 22, fontWeight: 800, color: '#fff', margin: 0,
  },
  section: {
    display: 'flex', flexDirection: 'column', gap: 8,
  },
  label: {
    fontSize: 12, fontWeight: 600, color: '#888',
    letterSpacing: '0.05em', textTransform: 'uppercase',
  },
  input: {
    padding: '12px 16px', fontSize: 15,
    background: '#1a1a1a', border: '1px solid #333',
    borderRadius: 10, color: '#fff', outline: 'none',
    width: '100%', boxSizing: 'border-box',
  },
  uploadZone: {
    border: '2px dashed #333', borderRadius: 12,
    padding: '20px', textAlign: 'center', cursor: 'pointer',
    transition: 'border-color 0.2s',
  },
  uploadText: {
    color: '#888', margin: 0, fontSize: 14,
  },
  hint: {
    fontSize: 12, color: '#555', margin: 0, lineHeight: 1.6,
  },
  table: {
    border: '1px solid #222', borderRadius: 10, overflow: 'hidden',
  },
  tableHeader: {
    display: 'grid', gridTemplateColumns: '40px 1fr 1fr 1.5fr 60px',
    background: '#1a1a1a', padding: '8px 12px', gap: 8,
  },
  tableRow: {
    display: 'grid', gridTemplateColumns: '40px 1fr 1fr 1.5fr 60px',
    padding: '8px 12px', gap: 8, borderTop: '1px solid #1a1a1a',
  },
  th: { fontSize: 11, fontWeight: 700, color: '#555', textTransform: 'uppercase' },
  td: { fontSize: 13, color: '#ccc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  error: {
    color: '#f87171', fontSize: 13, margin: 0, textAlign: 'center',
  },
  btn: {
    padding: '14px', background: 'linear-gradient(135deg, #3b82f6, #6d28d9)',
    border: 'none', borderRadius: 12, color: '#fff',
    fontSize: 15, fontWeight: 700, cursor: 'pointer',
    letterSpacing: '0.05em',
  },
  resultBox: {
    background: '#0d1f0d', border: '1px solid #1a4d1a',
    borderRadius: 14, padding: 24,
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: 10,
  },
  resultTitle: { fontSize: 16, fontWeight: 700, color: '#4ade80', margin: 0 },
  resultKey: {
    fontSize: 32, fontWeight: 900, color: '#fff',
    letterSpacing: '4px', fontFamily: 'monospace',
  },
  resultSub: { fontSize: 13, color: '#888', margin: 0 },
  copyBtn: {
    padding: '10px 28px', background: '#4ade80',
    border: 'none', borderRadius: 10, color: '#000',
    fontSize: 14, fontWeight: 700, cursor: 'pointer',
  },
}
