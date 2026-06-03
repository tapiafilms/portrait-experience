import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import AdminPage from './pages/AdminPage'
import LandingPage from './pages/LandingPage'
import { CameraProvider } from './context/CameraContext'
import { EventProvider } from './context/EventContext'
import './styles/global.css'

const path = window.location.pathname

let root
if (path.startsWith('/admin')) {
  root = <AdminPage />
} else if (path.startsWith('/totem')) {
  document.body.classList.add('totem-mode')
  // Solicitar permiso de micrófono solo en el tótem
  navigator.mediaDevices.getUserMedia({ audio: true })
    .then(stream => stream.getTracks().forEach(t => t.stop()))
    .catch(() => {})
  root = (
    <EventProvider>
      <App />
    </EventProvider>
  )
} else {
  root = <LandingPage />
}

ReactDOM.createRoot(document.getElementById('root')).render(root)
