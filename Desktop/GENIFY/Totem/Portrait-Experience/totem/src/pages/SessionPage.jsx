import { useEffect, useState, useRef } from 'react'

const BASE = ''

export default function SessionPage() {
  const sessionId = window.location.pathname.split('/session/')[1]
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState(null)
  const [showPortrait] = useState(true)
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

  const compressImage = (file) => new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (ev) => {
      const img = new Image()
      img.onload = () => {
        const MAX = 1280
        let { width, height } = img
        if (width > MAX || height > MAX) {
          if (width > height) { height = Math.round(height * MAX / width); width = MAX }
          else { width = Math.round(width * MAX / height); height = MAX }
        }
        const canvas = document.createElement('canvas')
        canvas.width = width; canvas.height = height
        canvas.getContext('2d').drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', 0.75))
      }
      img.src = ev.target.result
    }
    reader.readAsDataURL(file)
  })

  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    setUploadResult(null)

    try {
      const compressed = await compressImage(file)
      const res = await fetch(`${BASE}/api/photos/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photo: compressed, eventId: data.eventId }),
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

  if (loading) return (
    <div style={s.loadingRoot}>
      <video
        src="/loop.mp4"
        autoPlay
        loop
        muted
        playsInline
        style={s.loadingVideo}
      />
      <p style={s.loadingText}>Cargando tu retrato...</p>
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
      {showPortrait && (
        <>
          <div style={s.photoWrap}>
            <div style={s.photoBorder}>
              <img src={data.photoUrl} alt="Tu retrato" style={s.photo} />
            </div>
          </div>

          <button style={s.downloadBtn} onClick={handleDownload}>
            ⬇ Guardar en mi teléfono
          </button>
        </>
      )}

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
            <p style={s.successText}>✅ ¡Tu foto aparecerá en la pantalla grande en cualquier momento!</p>
            <button style={s.anotherBtn} onClick={() => { setUploadResult(null); handleTakePhoto() }}>
              📸 Tomar otra foto
            </button>
          </div>
        ) : uploadResult === 'rejected' ? (
          <div style={s.rejectedBox}>
            <p style={s.rejectedText}>⚠️ Foto no apta para el evento</p>
            <button style={s.cameraBtn} onClick={handleTakePhoto}>Intentar de nuevo</button>
          </div>
        ) : uploading ? (
          <div style={s.uploadingWrap}>
            <div style={s.orbitRing}>
              <div style={s.orbitDot} />
            </div>
            <div style={s.orbitRing2}>
              <div style={s.orbitDot2} />
            </div>
            <div style={s.orbitCore} />
            <p style={s.uploadingText}>Espera mientras publicamos...</p>
          </div>
        ) : (
          <button style={s.cameraBtn} onClick={handleTakePhoto}>
            📸 Tomar foto para el evento
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
        @keyframes orbit1 {
          from { transform: translateX(-50%) rotate(0deg); }
          to   { transform: translateX(-50%) rotate(360deg); }
        }
        @keyframes orbit2 {
          from { transform: translateX(-50%) rotate(0deg); }
          to   { transform: translateX(-50%) rotate(360deg); }
        }
        @keyframes corePulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50%       { opacity: 1;   transform: scale(1.12); }
        }
      `}</style>
    </div>
  )
}

const s = {
  root: {
    minHeight: '100dvh',
    background: '#050810',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center',
    fontFamily: "'Inter', system-ui, sans-serif",
    paddingBottom: 40,
    color: '#fff',
  },
  header: {
    width: '100%', padding: '20px 24px',
    display: 'flex', justifyContent: 'center',
  },
  logo: { height: 32, objectFit: 'contain' },
  photoWrap: {
    padding: '0 24px', width: '100%',
    maxWidth: 400, boxSizing: 'border-box',
    position: 'relative',
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
  successText: { color: '#4ade80', fontSize: 14, fontWeight: 600, margin: '0 0 12px' },
  anotherBtn: {
    width: '100%', padding: '12px',
    background: 'transparent',
    border: '1px solid rgba(74,222,128,0.4)',
    borderRadius: 50, color: '#4ade80',
    fontSize: 14, fontWeight: 700, cursor: 'pointer',
  },
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
  loadingRoot: {
    minHeight: '100dvh',
    background: '#050810',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    gap: 24,
  },
  loadingVideo: {
    width: 180, height: 180,
    objectFit: 'cover', borderRadius: '50%',
    border: '2px solid rgba(59,130,246,0.3)',
    boxShadow: '0 0 40px rgba(59,130,246,0.2)',
  },
  loadingText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14, letterSpacing: '0.05em',
  },
  uploadingWrap: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: 16,
    padding: '12px 0',
    position: 'relative',
  },
  orbitRing: {
    position: 'absolute',
    top: 0, left: '50%', transform: 'translateX(-50%)',
    width: 72, height: 72,
    borderRadius: '50%',
    border: '1.5px solid rgba(99,102,241,0.25)',
    animation: 'orbit1 1.6s linear infinite',
  },
  orbitDot: {
    position: 'absolute',
    top: -4, left: '50%', marginLeft: -4,
    width: 8, height: 8, borderRadius: '50%',
    background: 'linear-gradient(135deg, #6366f1, #22d3ee)',
    boxShadow: '0 0 8px rgba(99,102,241,0.8)',
  },
  orbitRing2: {
    position: 'absolute',
    top: 10, left: '50%', transform: 'translateX(-50%)',
    width: 52, height: 52,
    borderRadius: '50%',
    border: '1.5px solid rgba(34,211,238,0.2)',
    animation: 'orbit2 1.1s linear infinite reverse',
  },
  orbitDot2: {
    position: 'absolute',
    top: -4, left: '50%', marginLeft: -4,
    width: 6, height: 6, borderRadius: '50%',
    background: 'linear-gradient(135deg, #22d3ee, #a855f7)',
    boxShadow: '0 0 6px rgba(34,211,238,0.8)',
  },
  orbitCore: {
    width: 72, height: 72,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, rgba(34,211,238,0.05) 60%, transparent 100%)',
    animation: 'corePulse 1.6s ease-in-out infinite',
  },
  uploadingText: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 13, letterSpacing: '0.05em', margin: 0,
  },
}
