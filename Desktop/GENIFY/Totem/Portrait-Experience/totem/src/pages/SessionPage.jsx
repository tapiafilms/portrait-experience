import { useEffect, useState, useRef } from 'react'

const BASE = ''

export default function SessionPage() {
  const sessionId = window.location.pathname.split('/session/')[1]
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState(null)
  const cameraRef = useRef(null)

  useEffect(() => {
    fetch(`${BASE}/api/session/${sessionId}`, {
      headers: { Accept: 'application/json' },
    })
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [sessionId])

  const handleDownload = () => {
    const a = document.createElement('a')
    a.href = data.photoUrl
    a.download = 'mi-retrato-genofy.jpg'
    a.target = '_blank'
    a.click()
  }

  const handleTakePhoto = async () => {
    if (!cameraRef.current) return
    const input = cameraRef.current
    input.click()
  }

  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    setUploadResult(null)

    const reader = new FileReader()
    reader.onload = async (ev) => {
      try {
        const res = await fetch(`${BASE}/api/photos/upload`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ photo: ev.target.result, eventId: data.eventId }),
        })
        const result = await res.json()
        setUploadResult(result.status === 'approved' ? 'published' : 'rejected')
      } catch {
        setUploadResult('error')
      } finally {
        setUploading(false)
        e.target.value = ''
      }
    }
    reader.readAsDataURL(file)
  }

  if (loading) return (
    <div style={s.root}>
      <div style={s.spinner} />
    </div>
  )

  if (!data) return (
    <div style={s.root}>
      <p style={{ color: '#fff', textAlign: 'center' }}>Sesión no encontrada</p>
    </div>
  )

  return (
    <div style={s.root}>
      {/* Header */}
      <div style={s.header}>
        <img src="/logo-ai-portrait-experience.png" alt="AI Portrait Experience" style={s.logo} />
      </div>

      {/* Foto principal */}
      <div style={s.photoWrap}>
        <div style={s.photoBorder}>
          <img src={data.photoUrl} alt="Tu retrato" style={s.photo} />
        </div>
      </div>

      {/* Botón descargar */}
      <button style={s.downloadBtn} onClick={handleDownload}>
        ⬇ Guardar en mi teléfono
      </button>

      {/* Separador */}
      <div style={s.divider}>
        <div style={s.dividerLine} />
        <span style={s.dividerText}>Fotos del evento</span>
        <div style={s.dividerLine} />
      </div>

      {/* Carrusel de fotos Pixar */}
      {data.carousel?.length > 0 ? (
        <div style={s.carouselWrap}>
          <div style={s.carousel}>
            {[...data.carousel, ...data.carousel].map((item, i) => (
              <div key={`${item.id}-${i}`} style={s.carouselItem}>
                <img src={item.transformed_url} alt="Retrato" style={s.carouselImg} />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p style={s.noPhotos}>Sé el primero en aparecer aquí 🎭</p>
      )}

      {/* Botón tomar foto para pantalla grande */}
      <div style={s.cameraSection}>
        <p style={s.cameraTitle}>¿Quieres aparecer en la pantalla grande?</p>
        <p style={s.cameraSub}>Toma una foto y aparecerá en el evento en tiempo real</p>

        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        {uploadResult === 'published' ? (
          <div style={s.successBox}>
            <p style={s.successText}>✅ ¡Tu foto está en la pantalla grande!</p>
          </div>
        ) : uploadResult === 'rejected' ? (
          <div style={s.rejectedBox}>
            <p style={s.rejectedText}>⚠️ Foto no apta para el evento</p>
            <button style={s.cameraBtn} onClick={handleTakePhoto}>Intentar de nuevo</button>
          </div>
        ) : (
          <button
            style={{ ...s.cameraBtn, opacity: uploading ? 0.6 : 1 }}
            onClick={handleTakePhoto}
            disabled={uploading}
          >
            {uploading ? '⏳ Publicando...' : '📸 Tomar foto para el evento'}
          </button>
        )}
      </div>

      {/* Footer */}
      <div style={s.footer}>
        <p style={s.footerTag}>TECNOLOGÍA</p>
        <img src="/logo-genofy-transparent.png" alt="Genofy" style={s.footerLogo} />
      </div>

      <style>{`
        @keyframes scrollLeft {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  )
}

const s = {
  root: {
    minHeight: '100vh',
    background: '#050810',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center',
    fontFamily: "'Inter', system-ui, sans-serif",
    paddingBottom: 40,
  },
  header: {
    width: '100%', padding: '20px 24px',
    display: 'flex', justifyContent: 'center',
  },
  logo: { height: 32, objectFit: 'contain' },
  photoWrap: {
    padding: '0 24px', width: '100%',
    maxWidth: 400, boxSizing: 'border-box',
  },
  photoBorder: {
    padding: 3, borderRadius: 20,
    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6, #06b6d4)',
  },
  photo: {
    width: '100%', borderRadius: 18,
    display: 'block', objectFit: 'cover',
  },
  downloadBtn: {
    margin: '16px 24px 0',
    width: 'calc(100% - 48px)', maxWidth: 352,
    padding: '14px', borderRadius: 50,
    background: 'linear-gradient(135deg, #3b82f6, #6d28d9)',
    border: 'none', color: '#fff',
    fontSize: 15, fontWeight: 700,
    cursor: 'pointer', letterSpacing: '0.02em',
  },
  divider: {
    display: 'flex', alignItems: 'center', gap: 12,
    width: 'calc(100% - 48px)', margin: '28px 0 16px',
  },
  dividerLine: { flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' },
  dividerText: { fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', whiteSpace: 'nowrap' },
  carouselWrap: {
    width: '100%', overflow: 'hidden',
  },
  carousel: {
    display: 'flex', gap: 10,
    padding: '0 24px',
    animation: 'scrollLeft 30s linear infinite',
    width: 'max-content',
  },
  carouselItem: {
    width: 120, height: 160, flexShrink: 0,
    borderRadius: 12, overflow: 'hidden',
    border: '1px solid rgba(100,160,255,0.2)',
  },
  carouselImg: { width: '100%', height: '100%', objectFit: 'cover' },
  noPhotos: {
    fontSize: 14, color: 'rgba(255,255,255,0.3)',
    margin: '0 0 16px', textAlign: 'center',
  },
  cameraSection: {
    width: 'calc(100% - 48px)', maxWidth: 352,
    margin: '24px 0 0',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 20, padding: '24px 20px',
    textAlign: 'center',
  },
  cameraTitle: { fontSize: 16, fontWeight: 800, color: '#fff', margin: '0 0 8px' },
  cameraSub: { fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: '0 0 20px', lineHeight: 1.5 },
  cameraBtn: {
    width: '100%', padding: '14px',
    background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
    border: 'none', borderRadius: 50,
    color: '#fff', fontSize: 15, fontWeight: 700,
    cursor: 'pointer',
  },
  successBox: {
    background: 'rgba(74,222,128,0.1)',
    border: '1px solid rgba(74,222,128,0.3)',
    borderRadius: 12, padding: '12px 16px',
  },
  successText: { color: '#4ade80', fontSize: 14, fontWeight: 600, margin: 0 },
  rejectedBox: {
    display: 'flex', flexDirection: 'column', gap: 10,
  },
  rejectedText: { color: '#f87171', fontSize: 13, margin: 0 },
  footer: {
    marginTop: 32,
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: 4,
  },
  footerTag: { fontSize: 9, letterSpacing: '4px', color: 'rgba(255,255,255,0.3)', margin: 0, textTransform: 'uppercase' },
  footerLogo: { height: 24, objectFit: 'contain' },
  spinner: {
    width: 40, height: 40, borderRadius: '50%',
    border: '3px solid rgba(59,130,246,0.2)',
    borderTopColor: '#3b82f6',
    animation: 'spin 0.8s linear infinite',
    margin: 'auto',
    marginTop: '45vh',
  },
}
