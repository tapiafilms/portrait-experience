import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import AdminPage from './pages/AdminPage'
import LandingPage from './pages/LandingPage'
import { CameraProvider } from './context/CameraContext'
import { EventProvider } from './context/EventContext'
import './styles/global.css'

// Solicitar permiso de micrófono al arrancar para que macOS lo registre
navigator.mediaDevices.getUserMedia({ audio: true })
  .then(stream => stream.getTracks().forEach(t => t.stop()))
  .catch(() => {})

const path = window.location.pathname

let root
if (path.startsWith('/admin')) {
  root = <AdminPage />
} else if (path.startsWith('/totem')) {
  root = (
    <EventProvider>
      <CameraProvider>
        <App />
      </CameraProvider>
    </EventProvider>
  )
} else {
  root = <LandingPage />
}

ReactDOM.createRoot(document.getElementById('root')).render(root)
