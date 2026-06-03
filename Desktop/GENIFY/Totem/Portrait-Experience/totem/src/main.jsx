import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import AdminPage from './pages/AdminPage'
import { CameraProvider } from './context/CameraContext'
import { EventProvider } from './context/EventContext'
import './styles/global.css'

// Solicitar permiso de micrófono al arrancar para que macOS lo registre
navigator.mediaDevices.getUserMedia({ audio: true })
  .then(stream => stream.getTracks().forEach(t => t.stop()))
  .catch(() => {})

const isAdmin = window.location.pathname.startsWith('/admin')

ReactDOM.createRoot(document.getElementById('root')).render(
  isAdmin ? <AdminPage /> : (
    <EventProvider>
      <CameraProvider>
        <App />
      </CameraProvider>
    </EventProvider>
  )
)
