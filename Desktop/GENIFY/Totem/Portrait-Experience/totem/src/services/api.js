// En producción (Vercel) las rutas son relativas /api/...
// En desarrollo local apunta al servidor Express
const BASE = import.meta.env.VITE_API_URL || ''

export async function uploadCapture(blob) {
  const form = new FormData()
  form.append('photo', blob, 'capture.jpg')

  const res = await fetch(`${BASE}/api/capture`, { method: 'POST', body: form })
  if (!res.ok) throw new Error(`Upload failed: ${res.status}`)
  return res.json()
  // { sessionId, imageUrl, qrUrl, qrDataUrl }
}

export async function getSession(sessionId) {
  const res = await fetch(`${BASE}/api/session/${sessionId}`)
  if (!res.ok) throw new Error(`Session not found: ${res.status}`)
  return res.json()
}

export async function transformCapture({ sessionId, style, userName }) {
  const res = await fetch(`${BASE}/api/transform/${sessionId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ style, userName }),
  })
  if (!res.ok) throw new Error(`Transform failed: ${res.status}`)
  return res.json()
  // { sessionId, originalImageUrl, transformedImageUrl, style, demoMode }
}
