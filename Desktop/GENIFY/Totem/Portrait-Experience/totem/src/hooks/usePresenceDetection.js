import { useRef, useEffect, useCallback } from 'react'

const SENSITIVITY = 30       // diferencia de pixel para considerar movimiento
const MOTION_THRESHOLD = 0.03 // 3% de pixels con movimiento = presencia
const CHECK_INTERVAL = 300    // ms entre frames comparados
const CONFIRM_FRAMES = 3      // frames consecutivos con movimiento para confirmar presencia
const IDLE_FRAMES = 10        // frames sin movimiento para volver a idle

export function usePresenceDetection({ videoRef, active, onPresence, onAbsence }) {
  const prevDataRef = useRef(null)
  const motionCountRef = useRef(0)
  const idleCountRef = useRef(0)
  const presenceStateRef = useRef(false)
  const timerRef = useRef(null)

  const analyze = useCallback(() => {
    const video = videoRef.current
    if (!video || video.readyState < 2) return

    const w = 320
    const h = 240
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, w, h)
    const { data } = ctx.getImageData(0, 0, w, h)

    if (prevDataRef.current) {
      let diff = 0
      const total = data.length / 4
      for (let i = 0; i < data.length; i += 4) {
        const dr = Math.abs(data[i]     - prevDataRef.current[i])
        const dg = Math.abs(data[i + 1] - prevDataRef.current[i + 1])
        const db = Math.abs(data[i + 2] - prevDataRef.current[i + 2])
        if ((dr + dg + db) / 3 > SENSITIVITY) diff++
      }

      const ratio = diff / total
      const hasMotion = ratio > MOTION_THRESHOLD

      if (hasMotion) {
        motionCountRef.current++
        idleCountRef.current = 0
        if (!presenceStateRef.current && motionCountRef.current >= CONFIRM_FRAMES) {
          presenceStateRef.current = true
          onPresence?.()
        }
      } else {
        idleCountRef.current++
        motionCountRef.current = 0
        if (presenceStateRef.current && idleCountRef.current >= IDLE_FRAMES) {
          presenceStateRef.current = false
          onAbsence?.()
        }
      }
    }

    prevDataRef.current = data
  }, [videoRef, onPresence, onAbsence])

  useEffect(() => {
    if (!active) {
      clearInterval(timerRef.current)
      return
    }
    timerRef.current = setInterval(analyze, CHECK_INTERVAL)
    return () => clearInterval(timerRef.current)
  }, [active, analyze])
}
