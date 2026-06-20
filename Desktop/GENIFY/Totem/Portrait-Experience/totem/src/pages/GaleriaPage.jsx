import { useEffect, useState, useRef, useMemo } from 'react'
import { createClient } from '@supabase/supabase-js'

const INTERVAL   = 10000
const STAGGER    = 500
const ANIM_DUR   = 700
const EXIT_TOTAL = STAGGER * 2 + ANIM_DUR

export default function GaleriaPage() {
  const supabase = useMemo(() => createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
  ), [])
  const eventId = window.location.pathname.split('/galeria/')[1]

  // photos = fotos que YA se muestran (siempre múltiplo de 3)
  // pending = fotos nuevas esperando completar grupo de 3
  const [photos,  setPhotos]  = useState([])
  const [pending, setPending] = useState([])
  const [current, setCurrent] = useState(0)
  const [leaving, setLeaving] = useState(false)
  const [eventName, setEventName] = useState('')
  const photosRef = useRef([])
  const pendingRef = useRef([])

  useEffect(() => { photosRef.current  = photos  }, [photos])
  useEffect(() => { pendingRef.current = pending }, [pending])

  // Cuando pending llega a 3+, mover el primer grupo a photos
  useEffect(() => {
    if (pending.length >= 3) {
      const batch = pending.slice(0, 3)
      const rest  = pending.slice(3)
      setPhotos(prev => [...prev, ...batch])
      setPending(rest)
    }
  }, [pending])

  // Agrega fotos nuevas al buffer pending (evita duplicados)
  const addToPending = (incoming) => {
    setPending(prev => {
      const ids = new Set([...photosRef.current, ...prev].map(p => p.id))
      const nuevas = incoming.filter(p => !ids.has(p.id))
      return nuevas.length ? [...prev, ...nuevas] : prev
    })
  }

  // Carga inicial — las existentes van directo a photos (múltiplos de 3)
  useEffect(() => {
    supabase.from('events').select('event_name').eq('id', eventId).single()
      .then(({ data }) => { if (data) setEventName(data.event_name) })

    supabase.from('event_photos')
      .select('id, photo_url, created_at')
      .eq('event_id', eventId).eq('status', 'approved')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (!data?.length) return
        // Tomar solo múltiplos de 3 para mostrar, el resto al pending
        const completo = Math.floor(data.length / 3) * 3
        setPhotos(data.slice(0, completo))
        if (data.length % 3 !== 0) setPending(data.slice(completo))
      })
  }, [eventId])

  // Polling cada 15s
  useEffect(() => {
    const poll = async () => {
      const { data } = await supabase.from('event_photos')
        .select('id, photo_url, created_at')
        .eq('event_id', eventId).eq('status', 'approved')
        .order('created_at', { ascending: false })
      if (data?.length) addToPending(data)
    }
    const t = setInterval(poll, 15000)
    return () => clearInterval(t)
  }, [eventId])

  // Realtime como respaldo
  useEffect(() => {
    const ch = supabase.channel('galeria-rt')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'event_photos', filter: `event_id=eq.${eventId}` },
        ({ new: p }) => { if (p.status === 'approved') addToPending([p]) })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'event_photos', filter: `event_id=eq.${eventId}` },
        ({ new: p }) => { if (p.status === 'approved') addToPending([p]) })
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [eventId])

  // Avance automático con salida escalonada
  useEffect(() => {
    if (photos.length < 3) return
    const t = setInterval(() => {
      setLeaving(true)
      setTimeout(() => {
        setCurrent(prev => {
          const next = prev + 3
          return next >= photosRef.current.length ? 0 : next
        })
        setLeaving(false)
      }, EXIT_TOTAL + 100)
    }, INTERVAL)
    return () => clearInterval(t)
  }, [photos.length])

  const group = photos.slice(current, current + 3)

  if (!photos.length) return (
    <div style={s.root}>
      <img src="/bg-totem.png" alt="" style={s.bg} />
      <div style={s.bgOverlay} />
      <div style={s.waiting}>
        <img src="/logo-gen-ex.png" alt="" style={s.waitingLogo} />
        <p style={s.waitingText}>Esperando fotos del evento...</p>
        <p style={s.waitingEvent}>{eventName}</p>
        {pending.length > 0 && (
          <p style={s.waitingPending}>
            {pending.length} foto{pending.length > 1 ? 's' : ''} en espera ({3 - pending.length} más para publicar)
          </p>
        )}
        <div style={s.waitingDots}>
          {[0, 0.3, 0.6].map(d => <div key={d} style={{ ...s.wDot, animationDelay: `${d}s` }} />)}
        </div>
      </div>
      <img src="/logo.webp" alt="Genofy" style={{ ...s.footerLogo, position: 'relative', zIndex: 2, marginBottom: 24 }} />
    </div>
  )

  return (
    <div style={s.root}>
      <img src="/bg-totem.png" alt="" style={s.bg} />
      <div style={s.bgOverlay} />

      <div style={s.header}>
        <img src="/logo-gen-ex.png" alt="" style={s.headerLogo} />
        <p style={s.headerEvent}>{eventName}</p>
        <div style={s.counter}>{photos.length} foto{photos.length !== 1 ? 's' : ''}</div>
      </div>

      {/* 3 fotos con entrada/salida escalonada tipo naipe */}
      <div style={s.photoRow}>
        {group.map((photo, i) => (
          <div key={photo.id} style={s.photoCard}>
            <img
              src={photo.photo_url}
              alt="Foto del evento"
              style={{
                ...s.photo,
                animationName: leaving ? 'photoOut' : 'photoIn',
                animationDuration: `${ANIM_DUR}ms`,
                animationDelay: `${i * STAGGER}ms`,
                animationTimingFunction: leaving ? 'cubic-bezier(0.4,0,1,1)' : 'cubic-bezier(0,0,0.2,1)',
                animationFillMode: 'both',
              }}
            />
          </div>
        ))}
      </div>

      {/* Indicadores de grupo */}
      {Math.ceil(photos.length / 3) > 1 && (
        <div style={s.indicators}>
          {Array.from({ length: Math.ceil(photos.length / 3) }).map((_, i) => (
            <div key={i} style={{
              ...s.dot,
              width: i === Math.floor(current / 3) ? 24 : 8,
              background: i === Math.floor(current / 3) ? '#60a5fa' : 'rgba(255,255,255,0.2)',
            }} />
          ))}
        </div>
      )}

      <div style={s.footer}>
        <img src="/logo.webp" alt="Genofy" style={s.footerLogo} />
        <p style={s.footerText}>Escanea el QR del tótem para publicar tu foto</p>
      </div>

      <style>{`
        @keyframes photoIn {
          from { opacity: 0; transform: scale(0.88) translate(40px, 40px) rotate(6deg); filter: blur(8px); }
          60%  { opacity: 1; transform: scale(1.03) translate(-4px, -4px) rotate(-1deg); filter: blur(0); }
          to   { opacity: 1; transform: scale(1)    translate(0, 0)       rotate(0deg); filter: blur(0); }
        }
        @keyframes photoOut {
          from { opacity: 1; transform: scale(1)    translate(0, 0)        rotate(0deg);  filter: blur(0); }
          to   { opacity: 0; transform: scale(0.88) translate(-40px, -40px) rotate(-6deg); filter: blur(8px); }
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
    width: '100vw', height: '100vh', background: '#050810',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between',
    position: 'relative', overflow: 'hidden', fontFamily: "'Inter', system-ui, sans-serif",
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
    color: '#60a5fa', fontSize: 13, fontWeight: 700, padding: '6px 16px', borderRadius: 50,
  },
  photoRow: {
    zIndex: 2, flex: 1,
    display: 'flex', flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center',
    gap: 24, padding: '0 48px', width: '100%',
  },
  // Contenedor con aspect ratio vertical fijo — fuerza formato portrait
  photoCard: {
    flex: 1, maxWidth: '30vw',
    aspectRatio: '3 / 4',
    borderRadius: 24, overflow: 'hidden',
    boxShadow: '0 0 80px rgba(59,130,246,0.25), 0 24px 48px rgba(0,0,0,0.5)',
    border: '2px solid rgba(100,160,255,0.15)',
    flexShrink: 0,
  },
  photo: {
    width: '100%', height: '100%',
    objectFit: 'cover', objectPosition: 'center',
    display: 'block',
  },
  indicators: { zIndex: 2, display: 'flex', alignItems: 'center', gap: 6, padding: '0 48px 12px' },
  dot: { height: 8, borderRadius: 4, transition: 'all 0.4s ease' },
  footer: {
    zIndex: 2, width: '100%', padding: '12px 48px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    borderTop: '1px solid rgba(255,255,255,0.06)',
  },
  footerLogo: { height: 28, objectFit: 'contain' },
  footerText: { fontSize: 13, color: 'rgba(255,255,255,0.3)', margin: 0, letterSpacing: '0.05em' },
  waiting: { zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 },
  waitingLogo: { height: 48, objectFit: 'contain' },
  waitingText: { fontSize: 22, color: 'rgba(255,255,255,0.5)', margin: 0 },
  waitingEvent: { fontSize: 16, color: 'rgba(255,255,255,0.3)', margin: 0 },
  waitingPending: { fontSize: 13, color: 'rgba(96,165,250,0.6)', margin: 0 },
  waitingDots: { display: 'flex', gap: 8 },
  wDot: { width: 8, height: 8, borderRadius: '50%', background: '#3b82f6', animation: 'pulse 1.2s ease-in-out infinite' },
}
