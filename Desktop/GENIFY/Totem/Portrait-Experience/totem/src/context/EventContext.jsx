import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const EventContext = createContext(null)

export function EventProvider({ children, eventId = null }) {
  const [event, setEvent] = useState(() => {
    if (eventId) return null // se cargará por URL
    try {
      const saved = sessionStorage.getItem('genofy_event')
      return saved ? JSON.parse(saved) : null
    } catch { return null }
  })
  const [loadingEvent, setLoadingEvent] = useState(!!eventId)

  // Auto-cargar evento desde la URL si viene eventId
  useEffect(() => {
    if (!eventId) return
    const url = import.meta.env.VITE_SUPABASE_URL
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY
    if (!url || !key) { setLoadingEvent(false); return }
    const sb = createClient(url, key)
    sb.from('events').select('id, key, event_name, guests, active, document_url')
      .eq('id', eventId).single()
      .then(({ data }) => {
        if (data) {
          const eventData = { eventId: data.id, eventName: data.event_name, guests: data.guests, documentUrl: data.document_url || null }
          setEvent(eventData)
          sessionStorage.setItem('genofy_event', JSON.stringify(eventData))
        }
        setLoadingEvent(false)
      })
  }, [eventId])

  const login = useCallback((eventData) => {
    setEvent(eventData)
    sessionStorage.setItem('genofy_event', JSON.stringify(eventData))
  }, [])

  const logout = useCallback(() => {
    setEvent(null)
    sessionStorage.removeItem('genofy_event')
  }, [])

  if (loadingEvent) return null

  return (
    <EventContext.Provider value={{ event, login, logout }}>
      {children}
    </EventContext.Provider>
  )
}

export function useEvent() {
  return useContext(EventContext)
}
