import { useEffect, useState, useRef, useMemo } from 'react'
import { createClient } from '@supabase/supabase-js'

const INTERVAL = 8000   // ms por foto
const ANIM_OUT = 700    // ms de animación de salida

export default function GaleriaPage() {
  const supabase = useMemo(() => createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
  ), [])
  const eventId = window.location.pathname.split('/galeria/')[1]
  const [photos, setPhotos]       = useState([])
  const [current, setCurrent]     = useState(0)
  const [leaving, setLeaving]     = useState(false)  // true = foto saliendo
  const [eventName, setEventName] = useState('')
  const photosRef = useRef([])
  const timerRef  = useRef(null)

  // Mantener ref sincronizada para usarla en el interval
  useEffect(() => { photosRef.current = photos }, [photos])

  // Cargar evento y fotos iniciales
  useEffect(() => {
    supabase.from('events').select('event_name').eq('id', eventId).single()
      .then(({ data }) => { if (data) setEventName(data.event_name) })

    supabase.from('event_photos')
      .select('id, photo_url, created_at')
      .eq('event_id', eventId)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .then(({ data }) => { if (data?.length) setPhotos(data) })
  }, [eventId])

  // Polling cada 15s para detectar fotos nuevas sin depender de realtime
  useEffect(() => {
    const poll = async () => {
      const { data } = await supabase
        .from('event_photos')
        .select('id, photo_url, created_at')
        .eq('event_id', eventId)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
      if (!data?.length) return
      setPhotos(prev => {
        const existingIds = new Set(prev.map(p => p.id))
        const newOnes = data.filter(p => !existingIds.has(p.id))
        return newOnes.length ? [...newOnes, ...prev] : prev
      })
    }
    const t = setInterval(poll, 15000)
    return () => clearInterval(t)
  }, [eventId])

  // Suscripción Realtime como refuerzo
  useEffect(() => {
    const channel = supabase
      .channel('galeria-rt')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'event_photos', filter: `event_id=eq.${eventId}` },
        (payload) => {
          if (payload.new.status === 'approved')
            setPhotos(prev => prev.find(p => p.id === payload.new.id) ? prev : [payload.new, ...prev])
        })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'event_photos', filter: `event_id=eq.${eventId}` },
        (payload) => {
          if (payload.new.status === 'approved')
            setPhotos(prev => prev.find(p => p.id === payload.new.id) ? prev : [payload.new, ...prev])
        })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [eventId])

  // Avance automático con animación de salida
  useEffect(() => {
    if (photos.length < 2) return
    clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setLeaving(true)
      setTimeout(() => {
        setCurrent(prev => (prev + 1) % photosRef.current.length)
        setLeaving(false)
      }, ANIM_OUT)
    }, INTERVAL)
    return () => clearInterval(timerRef.current)
  }, [photos.length])

  const photo = photos[current]

  if (!photos.length) return (
    <div style={s.root}>
      <img src="/bg-totem.png" alt="" style={s.bg} />
      <div style={s.bgOverlay} />
      <div style={s.waiting}>
        <img src="/logo-gen-ex.png" alt="" style={s.waitingLogo} />
        <p style={s.waitingText}>Esperando fotos del evento...</p>
        <p style={s.waitingEvent}>{eventName}</p>
        <div style={s.waitingDots}>
          <div style={s.wDot} />
          <div style={{ ...s.wDot, animationDelay: '0.3s' }} />
          <div style={{ ...s.wDot, animationDelay: '0.6s' }} />
        </div>
      </div>
      <img src="/logo.webp" alt="Genofy" style={s.footerLogoAlone} />
    </div>
  )

  return (
    <div style={s.root}>
      <img src="/bg-totem.png" alt="" style={s.bg} />
      <div style={s.bgOverlay} />

      {/* Header */}
      <div style={s.header}>
        <img src="/logo-gen-ex.png" alt="" style={s.headerLogo} />
        <p style={s.headerEvent}>{eventName}</p>
        <div style={s.counter}>{photos.length} foto{photos.length !== 1 ? 's' : ''}</div>
      </div>

      {/* Foto única con animación entrada/salida */}
      <div style={s.photoWrap}>
        {photo && (
          <img
            key={photo.id}
            src={photo.photo_url}
            alt="Foto del evento"
            style={{
              ...s.photo,
              animation: leaving
                ? `photoOut ${ANIM_OUT}ms cubic-bezier(0.4,0,1,1) forwards`
                : 'photoIn 0.9s cubic-bezier(0,0,0.2,1) forwards',
            }}
          />
        )}
      </div>

      {/* Indicadores */}
      {photos.length > 1 && (
        <div style={s.indicators}>
          {photos.map((_, i) => (
            <div
              key={i}
              style={{
                ...s.dot,
                width: i === current ? 24 : 8,
                background: i === current ? '#60a5fa' : 'rgba(255,255,255,0.2)',
              }}
            />
          ))}
        </div>
      )}

      {/* Footer */}
      <div style={s.footer}>
        <img src="/logo.webp" alt="Genofy" style={s.footerLogo} />
        <p style={s.footerText}>Escanea el QR del tótem para publicar tu foto</p>
      </div>

      <style>{`
        @keyframes photoIn {
          from { opacity: 0; transform: scale(1.06) translateY(16px); filter: blur(8px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);    filter: blur(0); }
        }
        @keyframes photoOut {
          from { opacity: 1; transform: scale(1)    translateY(0);     filter: blur(0); }
          to   { opacity: 0; transform: scale(0.94) translateY(-16px); filter: blur(8px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50%       { opacity: 1;   transform: scale(1); }
        }
      `}</style>
    </div>
  )
}

const s = {
  root: {
    width: '100vw', height: '100vh',
    background: '#050810',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'space-between',
    position: 'relative', overflow: 'hidden',
    fontFamily: "'Inter', system-ui, sans-serif",
  },
  bg: { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 },
  bgOverlay: { position: 'absolute', inset: 0, zIndex: 1, background: 'rgba(5,8,16,0.72)' },
  header: {
    zIndex: 2, width: '100%', padding: '24px 48px',
    display: 'flex', alignItems: 'center', gap: 24,
  },
  headerLogo: { height: 36, objectFit: 'contain' },
  headerEvent: {
    flex: 1, fontSize: 18, fontWeight: 700,
    color: 'rgba(255,255,255,0.7)', margin: 0,
    letterSpacing: '0.05em', textTransform: 'uppercase',
  },
  counter: {
    background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.4)',
    color: '#60a5fa', fontSize: 13, fontWeight: 700,
    padding: '6px 16px', borderRadius: 50,
  },
  photoWrap: {
    zIndex: 2, flex: 1,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '0 80px', width: '100%',
  },
  photo: {
    maxHeight: '68vh', maxWidth: '72vw',
    borderRadius: 28, objectFit: 'contain',
    boxShadow: '0 0 120px rgba(59,130,246,0.25), 0 32px 64px rgba(0,0,0,0.6)',
    border: '2px solid rgba(100,160,255,0.15)',
  },
  indicators: {
    zIndex: 2, display: 'flex', alignItems: 'center', gap: 6, padding: '0 48px 12px',
  },
  dot: {
    height: 8, borderRadius: 4,
    transition: 'all 0.4s ease',
  },
  footer: {
    zIndex: 2, width: '100%', padding: '12px 48px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    borderTop: '1px solid rgba(255,255,255,0.06)',
  },
  footerLogo: { height: 28, objectFit: 'contain' },
  footerLogoAlone: { height: 28, objectFit: 'contain', position: 'relative', zIndex: 2, marginBottom: 24 },
  footerText: { fontSize: 13, color: 'rgba(255,255,255,0.3)', margin: 0, letterSpacing: '0.05em' },
  waiting: { zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 },
  waitingLogo: { height: 48, objectFit: 'contain' },
  waitingText: { fontSize: 22, color: 'rgba(255,255,255,0.5)', margin: 0 },
  waitingEvent: { fontSize: 16, color: 'rgba(255,255,255,0.3)', margin: 0 },
  waitingDots: { display: 'flex', gap: 8 },
  wDot: { width: 8, height: 8, borderRadius: '50%', background: '#3b82f6', animation: 'pulse 1.2s ease-in-out infinite' },
}
