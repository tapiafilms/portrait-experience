import { useEffect, useRef } from 'react'

export default function AvatarVideo({ isSpeaking = true, style = {} }) {
  const videoRef = useRef(null)

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    if (isSpeaking) {
      v.play().catch(() => {})
    } else {
      v.pause()
    }
  }, [isSpeaking])

  return (
    <video
      ref={videoRef}
      src="/loop.mp4"
      loop
      muted
      playsInline
      style={{ width: '100%', height: '100%', objectFit: 'cover', ...style }}
    />
  )
}
