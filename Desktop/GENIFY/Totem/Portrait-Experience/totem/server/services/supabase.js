const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

const BUCKET = 'portraits'

// Sube un buffer al bucket y devuelve la URL pública
async function uploadImage(buffer, filename, contentType = 'image/jpeg') {
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filename, buffer, { contentType, upsert: true })

  if (error) throw new Error(`Storage upload error: ${error.message}`)

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filename)
  return data.publicUrl
}

// Guarda una sesión en la tabla sessions
async function saveSession(session) {
  const { data, error } = await supabase
    .from('sessions')
    .insert(session)
    .select()
    .single()

  if (error) throw new Error(`DB insert error: ${error.message}`)
  return data
}

// Actualiza una sesión existente
async function updateSession(id, updates) {
  const { data, error } = await supabase
    .from('sessions')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(`DB update error: ${error.message}`)
  return data
}

// Obtiene una sesión por ID
async function getSession(id) {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return data
}

module.exports = { uploadImage, saveSession, updateSession, getSession }
