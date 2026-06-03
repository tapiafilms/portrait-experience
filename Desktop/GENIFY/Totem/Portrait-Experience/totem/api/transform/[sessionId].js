const { createClient } = require('@supabase/supabase-js')
const { v4: uuidv4 } = require('uuid')
const sharp = require('sharp')
const path = require('path')

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { sessionId } = req.query
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)
  const BUCKET = 'portraits'

  const { data: session } = await supabase.from('sessions').select('*').eq('id', sessionId).single()
  if (!session) return res.status(404).json({ error: 'Sesión no encontrada' })

  try {
    const imgRes = await fetch(session.image_url)
    const originalBuffer = Buffer.from(await imgRes.arrayBuffer())

    const preparedBuffer = await sharp(originalBuffer)
      .resize(768, 1024, { fit: 'cover', position: 'top' })
      .jpeg({ quality: 95 }).toBuffer()

    const hasKey = !!process.env.FAL_API_KEY
    let resultUrl

    if (hasKey) {
      const { fal } = require('@fal-ai/client')
      fal.config({ credentials: process.env.FAL_API_KEY })
      const blob = new Blob([preparedBuffer], { type: 'image/jpeg' })
      const imageUrl = await fal.storage.upload(blob)

      const prompt = `The image shows a PERSON — transform them into a premium Pixar 3D animated character that is instantly and unmistakably recognizable as that same person: preserve their exact face structure, hair color and style, eye color, skin tone, facial hair and any distinctive features, faithfully translated into Pixar art style. Render quality like Coco, Up or Soul. The character should have big expressive Pixar eyes, smooth subsurface scattering skin, detailed hair grooming. Improve posture naturally: confident and charismatic stance, relaxed shoulders. IMPORTANT: always give the character a warm, genuine, joyful smile and happy expression regardless of the expression in the original photo — the character must look happy, energetic and celebratory. Preserve and enhance original clothing with premium quality. Background: elegant outdoor corporate event at night, warm golden string lights, purple and blue accent lighting, guests socializing in the background, bokeh, luxury cocktail atmosphere. Cinematic Pixar lighting with warm key light on face, soft rim light, golden highlights. Mood: celebration, success, innovation. Ultra high quality, 8K Pixar feature film render.`

      const result = await fal.subscribe('fal-ai/flux-pro/kontext', {
        input: { image_url: imageUrl, prompt, num_images: 1, guidance_scale: 3.5, safety_tolerance: '2', output_format: 'jpeg', aspect_ratio: '3:4' },
        logs: false,
      })
      resultUrl = result?.data?.images?.[0]?.url
      if (!resultUrl) throw new Error('fal.ai no devolvió imagen')
    } else {
      resultUrl = `data:image/jpeg;base64,${preparedBuffer.toString('base64')}`
    }

    let transformedBuffer
    if (resultUrl.startsWith('http')) {
      const r = await fetch(resultUrl)
      transformedBuffer = Buffer.from(await r.arrayBuffer())
    } else {
      transformedBuffer = Buffer.from(resultUrl.replace(/^data:image\/\w+;base64,/, ''), 'base64')
    }

    // Watermark
    const LOGO_PATH = path.join(process.cwd(), 'public/logo-genofy-transparent.png')
    const image = sharp(transformedBuffer)
    const meta = await image.metadata()
    const logoW = Math.round(meta.width * 0.22)
    const logoResized = await sharp(LOGO_PATH).resize(logoW, null).png().toBuffer()
    const logoMeta = await sharp(logoResized).metadata()
    const padding = Math.round(meta.width * 0.04)
    const finalBuffer = await image.composite([{
      input: logoResized,
      left: meta.width - logoMeta.width - padding,
      top: meta.height - logoMeta.height - padding,
      blend: 'over',
    }]).jpeg({ quality: 92 }).toBuffer()

    const finalFilename = `transformed/${uuidv4()}.jpg`
    const { error: upErr } = await supabase.storage.from(BUCKET).upload(finalFilename, finalBuffer, { contentType: 'image/jpeg', upsert: true })
    if (upErr) throw new Error(upErr.message)

    const { data: { publicUrl: transformedImageUrl } } = supabase.storage.from(BUCKET).getPublicUrl(finalFilename)

    await supabase.from('sessions').update({ transformed_url: transformedImageUrl }).eq('id', sessionId)

    res.json({ sessionId, originalImageUrl: session.image_url, transformedImageUrl, demoMode: !hasKey })
  } catch (err) {
    console.error('[transform]', err.message)
    res.status(500).json({ error: err.message })
  }
}
