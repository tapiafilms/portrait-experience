const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'genofy2025'

module.exports = function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const { password } = req.body
  if (password === ADMIN_PASSWORD) return res.json({ ok: true })
  return res.status(401).json({ error: 'Contraseña incorrecta' })
}
