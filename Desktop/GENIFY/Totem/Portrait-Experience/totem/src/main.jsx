import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import AdminPage from './pages/AdminPage'
import LandingPage from './pages/LandingPage'
import SessionPage from './pages/SessionPage'
import GaleriaPage from './pages/GaleriaPage'
import SorteoAdmin from './pages/SorteoAdmin'
import { EventProvider } from './context/EventContext'
import './styles/global.css'

const path = window.location.pathname

// Extraer eventId de rutas tipo /totem/[id] o /admin/[id]
const totemMatch  = path.match(/^\/totem\/([^/]+)/)
const adminMatch  = path.match(/^\/admin\/([^/]+)/)
const totemEventId = totemMatch?.[1] || null
const adminEventId = adminMatch?.[1] || null

let root
if (path.startsWith('/sorteo-admin')) {
  root = <SorteoAdmin />
} else if (path.startsWith('/admin')) {
  root = <AdminPage eventId={adminEventId} />
} else if (path.startsWith('/session/')) {
  root = <SessionPage />
} else if (path.startsWith('/galeria/')) {
  document.body.classList.add('totem-mode')
  root = <GaleriaPage />
} else if (path.startsWith('/totem')) {
  document.body.classList.add('totem-mode')
  navigator.mediaDevices.getUserMedia({ audio: true })
    .then(stream => stream.getTracks().forEach(t => t.stop()))
    .catch(() => {})
  root = (
    <EventProvider eventId={totemEventId}>
      <App />
    </EventProvider>
  )
} else {
  root = <LandingPage />
}

ReactDOM.createRoot(document.getElementById('root')).render(root)
