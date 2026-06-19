import { useEffect, useState, useRef, useCallback } from 'react'

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

      {/* Sección SORTEO */}
      {data.eventId && (
        <SorteoSection sessionId={sessionId} eventId={data.eventId} />
      )}

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

// ══════════════════════════════════════════
// SORTEO SECTION — Momento 3
// ══════════════════════════════════════════
function SorteoSection({ sessionId, eventId }) {
  // phase: 'inactive' | 'active' | 'camera' | 'countdown' | 'capturing' |
  //        'uploading' | 'waiting' | 'paired' | 'hunting' | 'scanning' | 'confirmed'
  const [phase, setPhase]           = useState('inactive')
  const [countdown, setCountdown]   = useState(null)   // número actual del countdown
  const [partnerSelfie, setPartnerSelfie] = useState(null)
  const [partnerSessionId, setPartnerSessionId] = useState(null)
  const [alertMsg, setAlertMsg]     = useState(null)

  const videoRef    = useRef(null)
  const streamRef   = useRef(null)
  const canvasRef   = useRef(null)
  const pollRef     = useRef(null)
  const pairPollRef = useRef(null)
  const countdownRef = useRef(null)
  const scanVideoRef  = useRef(null)
  const scanStreamRef = useRef(null)
  const jsQRRef     = useRef(null)
  const captureCalledRef = useRef(false)

  const flash = (msg, ms = 3000) => { setAlertMsg(msg); setTimeout(() => setAlertMsg(null), ms) }

  // ── Cargar jsQR para el escáner ──────────────────────────────────────────
  useEffect(() => {
    if (window.jsQR) { jsQRRef.current = window.jsQR; return }
    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jsQR/1.4.0/jsQR.js'
    script.onload = () => { jsQRRef.current = window.jsQR }
    document.head.appendChild(script)
  }, [])

  // ── Poll estado del sorteo ────────────────────────────────────────────────
  useEffect(() => {
    const poll = async () => {
      try {
        const r = await fetch(`${BASE}/api/sorteo/state?eventId=${eventId}`)
        const d = await r.json()
        const serverState = d.state || 'inactive'

        // Solo avanzar si el servidor nos lo dice (no retroceder fases ya activas)
        if (serverState === 'active' && phase === 'inactive') setPhase('active')

        if (serverState === 'countdown' && (phase === 'active' || phase === 'inactive')) {
          // Calcular countdown restante desde el servidor
          const startAt = new Date(d.countdown_start_at).getTime()
          const totalMs = (d.countdown_seconds || 5) * 1000
          const elapsed = Date.now() - startAt
          const remaining = Math.ceil((totalMs - elapsed) / 1000)

          if (remaining > 0) {
            setPhase('countdown')
            startCountdownTimer(remaining, startAt, totalMs)
          } else {
            // Ya pasó — capturar foto si todavía no lo hemos hecho
            if (phase === 'active' || phase === 'inactive') captureAndUpload()
          }
        }
      } catch {}
    }
    poll()
    pollRef.current = setInterval(poll, 2500)
    return () => clearInterval(pollRef.current)
  }, [eventId, phase])

  // ── Countdown timer ───────────────────────────────────────────────────────
  const startCountdownTimer = useCallback((initial, startAt, totalMs) => {
    clearInterval(countdownRef.current)
    setCountdown(initial)
    countdownRef.current = setInterval(() => {
      const elapsed = Date.now() - startAt
      const remaining = Math.ceil((totalMs - elapsed) / 1000)
      if (remaining > 0) {
        setCountdown(remaining)
      } else {
        clearInterval(countdownRef.current)
        setCountdown(0)
        captureAndUpload()
      }
    }, 200)
  }, [])

  // ── Abrir cámara selfie ───────────────────────────────────────────────────
  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
      setPhase('camera')
    } catch (err) {
      flash('No se pudo acceder a la cámara. Permite el acceso e intenta de nuevo.')
    }
  }

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
  }

  // ── Capturar foto y subir ─────────────────────────────────────────────────
  const captureAndUpload = useCallback(async () => {
    if (captureCalledRef.current) return
    captureCalledRef.current = true
    setPhase('capturing')
    // Pequeño delay visual
    await new Promise(r => setTimeout(r, 300))

    let selfieData = null
    if (videoRef.current && streamRef.current) {
      const canvas = document.createElement('canvas')
      const v = videoRef.current
      canvas.width  = v.videoWidth  || 480
      canvas.height = v.videoHeight || 480
      canvas.getContext('2d').drawImage(v, 0, 0)
      selfieData = canvas.toDataURL('image/jpeg', 0.8)
      stopCamera()
    }

    if (!selfieData) { setPhase('camera'); return }

    setPhase('uploading')
    try {
      const r = await fetch(`${BASE}/api/sorteo/photo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, sessionId, selfie: selfieData }),
      })
      const d = await r.json()
      if (d.status === 'paired') {
        setPartnerSelfie(d.partner_selfie_url)
        setPartnerSessionId(d.partner_session_id)
        setPhase('paired')
      } else {
        setPhase('waiting')
        pollForPair()
      }
    } catch {
      setPhase('camera')
      flash('Error al subir la foto. Intenta de nuevo.')
    }
  }, [eventId, sessionId])

  // ── Poll para saber si nos emparejaron ───────────────────────────────────
  const pollForPair = useCallback(() => {
    clearInterval(pairPollRef.current)
    const startedAt = Date.now()
    pairPollRef.current = setInterval(async () => {
      try {
        const r = await fetch(`${BASE}/api/sorteo/pair-status?sessionId=${sessionId}`)
        const d = await r.json()
        if (d.status === 'paired') {
          clearInterval(pairPollRef.current)
          setPartnerSelfie(d.partner_selfie_url)
          setPartnerSessionId(d.partner_session_id)
          setPhase('paired')
        } else if (Date.now() - startedAt > 45_000) {
          // Sin pareja después de 45s — número impar de participantes
          clearInterval(pairPollRef.current)
          setPhase('no-pair')
        }
      } catch {}
    }, 2000)
  }, [sessionId])

  // ── Escáner QR ─────────────────────────────────────────────────────────────
  const openQRScanner = async () => {
    setPhase('scanning')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      })
      scanStreamRef.current = stream
      if (scanVideoRef.current) {
        scanVideoRef.current.srcObject = stream
        scanVideoRef.current.play()
        scanQRFrames()
      }
    } catch {
      flash('No se pudo abrir la cámara trasera.')
      setPhase('paired')
    }
  }

  const stopQRScanner = () => {
    scanStreamRef.current?.getTracks().forEach(t => t.stop())
    scanStreamRef.current = null
  }

  const scanQRFrames = () => {
    const tick = () => {
      if (!scanVideoRef.current || !scanStreamRef.current) return
      const v = scanVideoRef.current
      if (v.readyState !== v.HAVE_ENOUGH_DATA) { requestAnimationFrame(tick); return }
      const canvas = document.createElement('canvas')
      canvas.width = v.videoWidth; canvas.height = v.videoHeight
      canvas.getContext('2d').drawImage(v, 0, 0)
      const imageData = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height)
      const qr = jsQRRef.current?.(imageData.data, canvas.width, canvas.height)
      if (qr?.data) {
        // Extraer sessionId de la URL escaneada
        const match = qr.data.match(/\/session\/([^/?#]+)/)
        if (match) {
          const scannedId = match[1]
          stopQRScanner()
          confirmFound(scannedId)
          return
        }
      }
      requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }

  const confirmFound = async (scannedSessionId) => {
    setPhase('uploading')
    try {
      const r = await fetch(`${BASE}/api/sorteo/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scannerSessionId: sessionId, scannedSessionId }),
      })
      const d = await r.json()
      if (d.ok) setPhase('confirmed')
      else { flash('QR incorrecto — escanea el teléfono de tu pareja.'); setPhase('hunting') }
    } catch {
      flash('Error al confirmar. Intenta de nuevo.')
      setPhase('hunting')
    }
  }

  useEffect(() => () => {
    stopCamera()
    stopQRScanner()
    clearInterval(countdownRef.current)
    clearInterval(pairPollRef.current)
  }, [])

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={ss.wrap}>
      <div style={ss.divider}>
        <div style={ss.dividerLine} />
        <span style={ss.dividerText}>Sorteo</span>
        <div style={ss.dividerLine} />
      </div>

      {alertMsg && <div style={ss.alert}>{alertMsg}</div>}

      {/* INACTIVE — botón siempre visible pero desactivado */}
      {(phase === 'inactive') && (
        <button style={ss.sorteoBtn} onClick={() => flash('⏳ El sorteo comenzará más tarde. ¡Estate atento!')}>
          <span style={ss.sorteoBtnIcon}>🎯</span>
          <span style={ss.sorteoBtnText}>SORTEO</span>
          <span style={ss.sorteoBtnSub}>Disponible más tarde en la noche</span>
        </button>
      )}

      {/* ACTIVE — botón habilitado */}
      {phase === 'active' && (
        <button style={{ ...ss.sorteoBtn, ...ss.sorteoBtnActive }} onClick={openCamera}>
          <span style={ss.sorteoBtnIcon}>🎯</span>
          <span style={ss.sorteoBtnText}>SORTEO</span>
          <span style={ss.sorteoBtnSub}>¡Toca para participar!</span>
        </button>
      )}

      {/* CAMERA — selfie en vivo */}
      {(phase === 'camera') && (
        <div style={ss.cameraBox}>
          <p style={ss.cameraInstr}>Apunta la cámara a tu cara y espera el countdown</p>
          <div style={ss.selfieWrap}>
            <video ref={videoRef} style={ss.selfieVideo} muted playsInline autoPlay />
            <div style={ss.selfieFrame} />
          </div>
          <p style={ss.cameraWaiting}>⏳ Esperando que el animador inicie el sorteo...</p>
        </div>
      )}

      {/* COUNTDOWN */}
      {phase === 'countdown' && (
        <div style={ss.cameraBox}>
          <div style={ss.selfieWrap}>
            <video ref={videoRef} style={ss.selfieVideo} muted playsInline autoPlay />
            <div style={ss.countdownOverlay}>
              <span style={ss.countdownNum}>{countdown}</span>
            </div>
          </div>
        </div>
      )}

      {/* CAPTURING */}
      {phase === 'capturing' && (
        <div style={ss.centerBox}>
          <div style={ss.flashAnim} />
          <p style={ss.centerText}>📸 ¡Foto tomada!</p>
        </div>
      )}

      {/* UPLOADING */}
      {phase === 'uploading' && (
        <div style={ss.centerBox}>
          <div style={ss.spinner} />
          <p style={ss.centerText}>Procesando...</p>
        </div>
      )}

      {/* WAITING — esperando pareja */}
      {phase === 'waiting' && (
        <div style={ss.centerBox}>
          <div style={ss.spinner} />
          <p style={ss.centerText}>Buscando tu pareja...</p>
          <p style={ss.centerSub}>El servidor está emparejando a todos los participantes</p>
        </div>
      )}

      {/* NO-PAIR — número impar, sin pareja disponible */}
      {phase === 'no-pair' && (
        <div style={ss.centerBox}>
          <p style={{ fontSize: 40 }}>😔</p>
          <p style={ss.centerText}>No encontramos pareja esta vez</p>
          <p style={ss.centerSub}>Habla con el animador para reclamar tu premio de todas formas</p>
        </div>
      )}

      {/* PAIRED — revelar pareja */}
      {phase === 'paired' && partnerSelfie && (
        <div style={ss.revealBox}>
          <p style={ss.revealTitle}>¡Tu pareja del sorteo es...</p>
          <div style={ss.partnerImgWrap}>
            <img src={partnerSelfie} alt="Tu pareja" style={ss.partnerImg} />
            <div style={ss.partnerGlow} />
          </div>
          <p style={ss.revealSub}>¡Encuéntrala en el evento!</p>
          <button style={ss.huntBtn} onClick={() => setPhase('hunting')}>
            🔍 Ir a buscarla
          </button>
        </div>
      )}

      {/* HUNTING — modo caza */}
      {phase === 'hunting' && (
        <div style={ss.huntBox}>
          <div style={ss.huntMiniWrap}>
            {partnerSelfie && <img src={partnerSelfie} alt="Tu pareja" style={ss.huntMiniImg} />}
          </div>
          <p style={ss.huntTitle}>¡Encuéntrala!</p>
          <p style={ss.huntSub}>Cuando la encuentres, escanea el QR que aparece en su teléfono</p>
          <button style={ss.scanBtn} onClick={openQRScanner}>
            📷 Escanear su QR
          </button>
        </div>
      )}

      {/* SCANNING — escáner QR activo */}
      {phase === 'scanning' && (
        <div style={ss.cameraBox}>
          <p style={ss.cameraInstr}>Apunta la cámara al QR en la pantalla de tu pareja</p>
          <div style={ss.selfieWrap}>
            <video ref={scanVideoRef} style={ss.selfieVideo} muted playsInline autoPlay />
            <div style={ss.qrFrame} />
          </div>
          <button style={ss.cancelBtn} onClick={() => { stopQRScanner(); setPhase('hunting') }}>
            Cancelar
          </button>
        </div>
      )}

      {/* CONFIRMED — ¡ganaron! */}
      {phase === 'confirmed' && (
        <div style={ss.confirmedBox}>
          <div style={ss.trophy}>🏆</div>
          <p style={ss.confirmedTitle}>¡Se encontraron!</p>
          <p style={ss.confirmedSub}>¡Felicitaciones! Acércate al animador para reclamar tu premio.</p>
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  )
}

const ss = {
  wrap: {
    width: 'calc(100% - 48px)', maxWidth: 352,
    margin: '0 0 0',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0,
  },
  divider: {
    display: 'flex', alignItems: 'center', gap: 12,
    width: '100%', margin: '28px 0 20px',
  },
  dividerLine: { flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' },
  dividerText: { fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', whiteSpace: 'nowrap' },
  alert: {
    width: '100%', padding: '10px 14px',
    background: 'rgba(99,102,241,0.15)',
    border: '1px solid rgba(99,102,241,0.3)',
    borderRadius: 10, fontSize: 13,
    textAlign: 'center', marginBottom: 12,
  },
  // Botón SORTEO
  sorteoBtn: {
    width: '100%', padding: '20px',
    background: 'rgba(255,255,255,0.04)',
    border: '1.5px solid rgba(255,255,255,0.1)',
    borderRadius: 20,
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
    cursor: 'pointer', color: '#fff',
    WebkitTapHighlightColor: 'transparent',
  },
  sorteoBtnActive: {
    background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(168,85,247,0.2))',
    border: '1.5px solid rgba(168,85,247,0.5)',
    boxShadow: '0 0 30px rgba(168,85,247,0.2)',
    animation: 'sorteoPulse 2s ease-in-out infinite',
  },
  sorteoBtnIcon: { fontSize: 32 },
  sorteoBtnText: { fontSize: 20, fontWeight: 900, letterSpacing: '0.1em' },
  sorteoBtnSub: { fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 400 },
  // Cámara
  cameraBox: {
    width: '100%',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
  },
  cameraInstr: { fontSize: 14, color: 'rgba(255,255,255,0.7)', textAlign: 'center', margin: 0 },
  cameraWaiting: { fontSize: 12, color: 'rgba(255,255,255,0.35)', textAlign: 'center', margin: 0 },
  selfieWrap: {
    position: 'relative', width: '100%', aspectRatio: '1',
    borderRadius: 20, overflow: 'hidden',
    border: '2px solid rgba(168,85,247,0.4)',
  },
  selfieVideo: { width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' },
  selfieFrame: {
    position: 'absolute', inset: 0,
    border: '3px solid rgba(168,85,247,0.6)',
    borderRadius: 18, pointerEvents: 'none',
  },
  qrFrame: {
    position: 'absolute',
    top: '20%', left: '20%', right: '20%', bottom: '20%',
    border: '3px solid rgba(34,211,238,0.8)',
    borderRadius: 8, pointerEvents: 'none',
  },
  // Countdown
  countdownOverlay: {
    position: 'absolute', inset: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  countdownNum: {
    fontSize: 120, fontWeight: 900, color: '#fff',
    textShadow: '0 0 40px rgba(168,85,247,0.8)',
    lineHeight: 1,
    animation: 'countPop 0.3s ease-out',
  },
  // Spinner / center
  centerBox: {
    width: '100%', padding: '32px 0',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
  },
  spinner: {
    width: 48, height: 48, borderRadius: '50%',
    border: '3px solid rgba(168,85,247,0.2)',
    borderTopColor: '#a855f7',
    animation: 'spin 0.8s linear infinite',
  },
  flashAnim: {
    width: 80, height: 80, borderRadius: '50%',
    background: 'radial-gradient(circle, #fff 0%, rgba(255,255,255,0) 70%)',
    animation: 'flashPop 0.4s ease-out forwards',
  },
  centerText: { fontSize: 16, fontWeight: 700, color: '#fff', margin: 0 },
  centerSub: { fontSize: 13, color: 'rgba(255,255,255,0.4)', textAlign: 'center', margin: 0 },
  // Reveal
  revealBox: {
    width: '100%',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
  },
  revealTitle: {
    fontSize: 18, fontWeight: 800, color: '#fff',
    textAlign: 'center', margin: 0,
  },
  partnerImgWrap: {
    position: 'relative', width: 200, height: 200,
  },
  partnerImg: {
    width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%',
    border: '3px solid rgba(168,85,247,0.6)',
  },
  partnerGlow: {
    position: 'absolute', inset: -8,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(168,85,247,0.3) 0%, transparent 70%)',
    animation: 'glowPulse 2s ease-in-out infinite',
    pointerEvents: 'none',
  },
  revealSub: { fontSize: 14, color: 'rgba(255,255,255,0.6)', margin: 0 },
  huntBtn: {
    width: '100%', padding: '16px',
    background: 'linear-gradient(135deg, #6366f1, #a855f7)',
    border: 'none', borderRadius: 50,
    color: '#fff', fontSize: 16, fontWeight: 800,
    cursor: 'pointer',
  },
  // Hunting
  huntBox: {
    width: '100%',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
  },
  huntMiniWrap: { position: 'relative' },
  huntMiniImg: {
    width: 100, height: 100, objectFit: 'cover', borderRadius: '50%',
    border: '2px solid rgba(168,85,247,0.5)',
  },
  huntTitle: { fontSize: 22, fontWeight: 900, color: '#fff', margin: 0 },
  huntSub: { fontSize: 13, color: 'rgba(255,255,255,0.5)', textAlign: 'center', margin: 0 },
  scanBtn: {
    width: '100%', padding: '16px',
    background: 'linear-gradient(135deg, #0891b2, #06b6d4)',
    border: 'none', borderRadius: 50,
    color: '#fff', fontSize: 16, fontWeight: 800,
    cursor: 'pointer',
  },
  cancelBtn: {
    padding: '10px 28px',
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: 50, color: 'rgba(255,255,255,0.6)',
    fontSize: 14, cursor: 'pointer',
  },
  // Confirmed
  confirmedBox: {
    width: '100%', padding: '32px 0',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
    textAlign: 'center',
  },
  trophy: { fontSize: 72 },
  confirmedTitle: { fontSize: 26, fontWeight: 900, color: '#fff', margin: 0 },
  confirmedSub: { fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, margin: 0 },
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
