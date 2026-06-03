import { createContext, useContext, useState, useCallback } from 'react'

const EventContext = createContext(null)

export function EventProvider({ children }) {
  const [event, setEvent] = useState(() => {
    // Recuperar sesión guardada (por si se recarga la página)
    try {
      const saved = sessionStorage.getItem('genofy_event')
      return saved ? JSON.parse(saved) : null
    } catch { return null }
  })

  const login = useCallback((eventData) => {
    setEvent(eventData)
    sessionStorage.setItem('genofy_event', JSON.stringify(eventData))
  }, [])

  const logout = useCallback(() => {
    setEvent(null)
    sessionStorage.removeItem('genofy_event')
  }, [])

  return (
    <EventContext.Provider value={{ event, login, logout }}>
      {children}
    </EventContext.Provider>
  )
}

export function useEvent() {
  return useContext(EventContext)
}
