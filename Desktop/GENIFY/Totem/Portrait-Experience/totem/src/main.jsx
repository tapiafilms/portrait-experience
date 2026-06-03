import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import AdminPage from './pages/AdminPage'
import LandingPage from './pages/LandingPage'
import SessionPage from './pages/SessionPage'
import GaleriaPage from './pages/GaleriaPage'
import { EventProvider } from './context/EventContext'
import './styles/global.css'

const path = window.location.pathname

let root
if (path.startsWith('/admin')) {
  root = <AdminPage />
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
    <EventProvider>
      <App />
    </EventProvider>
  )
} else {
  root = <LandingPage />
}

ReactDOM.createRoot(document.getElementById('root')).render(root)
