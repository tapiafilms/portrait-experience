import { createContext, useContext, useRef, useState, useCallback, useEffect } from 'react'

const CameraContext = createContext(null)

export function CameraProvider({ children }) {
  const streamRef = useRef(null)
  const videoRef = useRef(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState(null)

  // Adjunta el stream al elemento de video actual
  const attachStream = useCallback((videoEl) => {
    if (!videoEl || !streamRef.current) return
    if (videoEl.srcObject === streamRef.current) return
    videoEl.srcObject = streamRef.current
    videoEl.play().catch(() => {})
  }, [])

  // Callback ref — se llama cada vez que un componente monta/desmonta su <video>
  const setVideoRef = useCallback((el) => {
    videoRef.current = el
    if (el) attachStream(el)
  }, [attachStream])

  const start = useCallback(async () => {
    if (streamRef.current) {
      // Stream ya existe — solo re-adjuntar si hay video element
      if (videoRef.current) attachStream(videoRef.current)
      setReady(true)
      return
    }
    try {
      // Webcams solo soportan landscape — pedimos la mayor resolución disponible
      // y hacemos el crop portrait con CSS
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920, min: 1280 },
          height: { ideal: 1080, min: 720 },
          facingMode: 'user',
          frameRate: { ideal: 30 },
        },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) attachStream(videoRef.current)
      setReady(true)
      setError(null)
    } catch (err) {
      setError(err.message)
    }
  }, [attachStream])

  const stop = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    setReady(false)
  }, [])

  // Captura esperando que el video esté realmente reproduciendo
  const captureFrame = useCallback(async () => {
    const video = videoRef.current
    if (!video || !streamRef.current) return null

    // Esperar hasta que el video tenga dimensiones reales
    if (video.videoWidth === 0 || video.readyState < 2) {
      await new Promise((resolve) => {
        const onReady = () => resolve()
        video.addEventListener('canplay', onReady, { once: true })
        video.addEventListener('playing', onReady, { once: true })
        setTimeout(resolve, 3000) // timeout de seguridad
      })
    }

    const w = video.videoWidth || 1280
    const h = video.videoHeight || 720

    if (w === 0 || h === 0) return null

    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    canvas.getContext('2d').drawImage(video, 0, 0, w, h)
    return new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.95))
  }, [])

  useEffect(() => {
    start()
    return () => stop()
  }, []) // eslint-disable-line

  return (
    <CameraContext.Provider value={{ videoRef: setVideoRef, rawRef: videoRef, ready, error, start, stop, captureFrame }}>
      {children}
    </CameraContext.Provider>
  )
}

export function useSharedCamera() {
  const ctx = useContext(CameraContext)
  if (!ctx) throw new Error('useSharedCamera debe usarse dentro de CameraProvider')
  return ctx
}
