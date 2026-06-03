// En producción (Vercel) las rutas son relativas /api/...
// En desarrollo local apunta al servidor Express
const BASE = import.meta.env.VITE_API_URL || ''

export async function uploadCapture(blob) {
  // Convertir blob a base64 para evitar multipart en Vercel
  const base64 = await new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.readAsDataURL(blob)
  })

  const res = await fetch(`${BASE}/api/capture`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ photo: base64 }),
  })
  if (!res.ok) throw new Error(`Upload failed: ${res.status}`)
  return res.json()
}

export async function getSession(sessionId) {
  const res = await fetch(`${BASE}/api/session/${sessionId}`)
  if (!res.ok) throw new Error(`Session not found: ${res.status}`)
  return res.json()
}

const WORKER_URL = 'https://wufly-push.pablo77tapia.workers.dev'

export async function transformCapture({ sessionId }) {
  // 1. Iniciar job en el Worker
  const startRes = await fetch(`${BASE}/api/transform/${sessionId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  })
  if (!startRes.ok) throw new Error(`Transform failed: ${startRes.status}`)
  const { requestId, statusUrl, responseUrl } = await startRes.json()

  // 2. Polling hasta COMPLETED (máx 90s)
  const start = Date.now()
  let transformedImageUrl = null

  while (!transformedImageUrl && Date.now() - start < 90000) {
    await new Promise(r => setTimeout(r, 4000))

    const pollRes = await fetch(
      `${WORKER_URL}/api/portrait-status?statusUrl=${encodeURIComponent(statusUrl)}&responseUrl=${encodeURIComponent(responseUrl)}`
    )
    if (!pollRes.ok) continue
    const pollData = await pollRes.json()

    if (pollData.status === 'COMPLETED' && pollData.imageUrl) {
      transformedImageUrl = pollData.imageUrl
    } else if (pollData.status === 'FAILED') {
      throw new Error('Transformación fallida en fal.ai')
    }
  }

  if (!transformedImageUrl) throw new Error('Timeout esperando transformación')

  // 3. Guardar resultado en DB
  await fetch(`${BASE}/api/transform/${sessionId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transformedImageUrl }),
  })

  return { sessionId, transformedImageUrl, demoMode: false }
}
