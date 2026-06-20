import { useEffect, useState, useRef, useMemo } from 'react'
import { createClient } from '@supabase/supabase-js'

export default function GaleriaPage() {
  const supabase = useMemo(() => createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
  ), [])
  const eventId = window.location.pathname.split('/galeria/')[1]
  const [photos, setPhotos] = useState([])
  const [current, setCurrent] = useState(0)
  const [eventName, setEventName] = useState('')
  const timerRef = useRef(null)

  // Cargar evento y fotos iniciales
  useEffect(() => {
    // Nombre del evento
    supabase.from('events').select('event_name').eq('id', eventId).single()
      .then(({ data }) => { if (data) setEventName(data.event_name) })

    // Fotos aprobadas
    supabase.from('event_photos')
      .select('id, photo_url, created_at')
      .eq('event_id', eventId)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .then(({ data }) => { if (data?.length) setPhotos(data) })
  }, [eventId])

  // Suscripción Realtime — nuevas fotos aparecen automáticamente
  useEffect(() => {
    const channel = supabase
      .channel('galeria')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'event_photos',
        filter: `event_id=eq.${eventId}`,
      }, (payload) => {
        if (payload.new.status === 'approved') {
          setPhotos(prev => [payload.new, ...prev])
        }
      })
      // También escuchar updates (cuando moderación cambia a approved)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'event_photos',
        filter: `event_id=eq.${eventId}`,
      }, (payload) => {
        if (payload.new.status === 'approved') {
          setPhotos(prev => {
            const exists = prev.find(p => p.id === payload.new.id)
            if (exists) return prev
            return [payload.new, ...prev]
          })
        }
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [eventId])

  // Auto-advance de grupo en grupo (de 3 en 3)
  useEffect(() => {
    if (photos.length < 2) return
    timerRef.current = setInterval(() => {
      setCurrent(prev => {
        const total = photos.length
        const next = prev + 3
        return next >= total ? 0 : next
      })
    }, 5000)
    return () => clearInterval(timerRef.current)
  }, [photos.length])

  if (!photos.length) return (
    <div style={s.root}>
      <img src="/bg-totem.png" alt="" style={s.bg} />
      <div style={s.bgOverlay} />
      <div style={s.waiting}>
        <img src="/logo-ai-portrait-experience.png" alt="" style={s.waitingLogo} />
        <p style={s.waitingText}>Esperando fotos del evento...</p>
        <p style={s.waitingEvent}>{eventName}</p>
        <div style={s.waitingDots}>
          <div style={s.dot} />
          <div style={{ ...s.dot, animationDelay: '0.3s' }} />
          <div style={{ ...s.dot, animationDelay: '0.6s' }} />
        </div>
      </div>
      <img src="/logo-genofy-transparent.png" alt="Genofy" style={s.footerLogo} />
    </div>
  )

  const group = photos.slice(current, current + 3)

  return (
    <div style={s.root}>
      <img src="/bg-totem.png" alt="" style={s.bg} />
      <div style={s.bgOverlay} />

      {/* Header */}
      <div style={s.header}>
        <img src="/logo-ai-portrait-experience.png" alt="" style={s.headerLogo} />
        <p style={s.headerEvent}>{eventName}</p>
        <div style={s.counter}>{photos.length} foto{photos.length !== 1 ? 's' : ''}</div>
      </div>

      {/* Grupo de 3 fotos */}
      <div style={s.mainPhotoWrap}>
        {group.map(photo => (
          <img
            key={photo.id}
            src={photo.photo_url}
            alt="Foto del evento"
            style={s.mainPhoto}
          />
        ))}
      </div>

      {/* Indicadores de grupo */}
      {Math.ceil(photos.length / 3) > 1 && (
        <div style={s.indicators}>
          {Array.from({ length: Math.ceil(photos.length / 3) }).map((_, i) => (
            <div
              key={i}
              style={{ ...s.indicator, background: i === Math.floor(current / 3) ? '#60a5fa' : 'rgba(255,255,255,0.2)' }}
              onClick={() => setCurrent(i * 3)}
            />
          ))}
        </div>
      )}

      {/* Footer */}
      <div style={s.footer}>
        <img src="/logo-genofy-transparent.png" alt="Genofy" style={s.footerLogo} />
        <p style={s.footerText}>Escanea el QR del tótem para publicar tu foto</p>
      </div>

      <style>{`
        @keyframes fadeInPhoto {
          from { opacity: 0; transform: scale(1.03); }
          to   { opacity: 1; transform: scale(1); }
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
  bg: {
    position: 'absolute', inset: 0,
    width: '100%', height: '100%',
    objectFit: 'cover', zIndex: 0,
  },
  bgOverlay: {
    position: 'absolute', inset: 0, zIndex: 1,
    background: 'rgba(5,8,16,0.75)',
  },
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
    background: 'rgba(59,130,246,0.2)',
    border: '1px solid rgba(59,130,246,0.4)',
    color: '#60a5fa', fontSize: 13, fontWeight: 700,
    padding: '6px 16px', borderRadius: 50,
  },
  mainPhotoWrap: {
    zIndex: 2, flex: 1,
    display: 'flex', flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center',
    gap: 24, padding: '0 48px',
  },
  mainPhoto: {
    flex: 1, maxHeight: '65vh', maxWidth: '30vw',
    borderRadius: 24, objectFit: 'cover',
    boxShadow: '0 0 80px rgba(59,130,246,0.3)',
    animation: 'fadeInPhoto 0.8s ease',
    border: '2px solid rgba(100,160,255,0.2)',
  },
  indicators: {
    zIndex: 2, display: 'flex', gap: 8, padding: '0 48px 12px',
  },
  indicator: {
    width: 8, height: 8, borderRadius: '50%',
    cursor: 'pointer', transition: 'background 0.3s ease',
  },
  footer: {
    zIndex: 2, width: '100%', padding: '12px 48px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    borderTop: '1px solid rgba(255,255,255,0.06)',
  },
  footerLogo: { height: 24, objectFit: 'contain' },
  footerText: {
    fontSize: 13, color: 'rgba(255,255,255,0.3)',
    margin: 0, letterSpacing: '0.05em',
  },
  // Pantalla de espera
  waiting: {
    zIndex: 2, display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: 16,
  },
  waitingLogo: { height: 48, objectFit: 'contain' },
  waitingText: { fontSize: 22, color: 'rgba(255,255,255,0.5)', margin: 0 },
  waitingEvent: { fontSize: 16, color: 'rgba(255,255,255,0.3)', margin: 0 },
  waitingDots: { display: 'flex', gap: 8 },
  dot: {
    width: 8, height: 8, borderRadius: '50%',
    background: '#3b82f6',
    animation: 'pulse 1.2s ease-in-out infinite',
  },
}
