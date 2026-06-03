const { fal } = require('@fal-ai/client')
const fs = require('fs')

function initClient() {
  const key = process.env.FAL_API_KEY
  if (!key) throw new Error('FAL_API_KEY no configurado en .env')
  fal.config({ credentials: key })
}

// Prompt Kontext: describe la imagen de referencia explícitamente
// Este modelo entiende "The image shows a PERSON — transform them..."
const buildPrompt = () =>
  `The image shows a PERSON — transform them into a premium Pixar 3D animated character that is instantly and unmistakably recognizable as that same person: preserve their exact face structure, hair color and style, eye color, skin tone, facial hair and any distinctive features, faithfully translated into Pixar art style. Render quality like Coco, Up or Soul. The character should have big expressive Pixar eyes, smooth subsurface scattering skin, detailed hair grooming. Improve posture naturally: confident and charismatic stance, relaxed shoulders. Preserve the character's natural facial expression exactly as it appears in the original photo. Preserve and enhance original clothing with premium quality. Background: elegant outdoor corporate event at night, warm golden string lights, purple and blue accent lighting, guests socializing in the background, bokeh, luxury cocktail atmosphere. Cinematic Pixar lighting with warm key light on face, soft rim light, golden highlights. Mood: celebration, success, innovation. Ultra high quality, 8K Pixar feature film render.`

const NEGATIVE = `low quality, blurry, generic cartoon, anime, flat 2D, distorted face, wrong facial proportions, different person, exaggerated caricature, plastic skin, creepy eyes, extra fingers, bad anatomy, low resolution, childish, text, watermark`

async function uploadToFal(imageBuffer) {
  const blob = new Blob([imageBuffer], { type: 'image/jpeg' })
  return await fal.storage.upload(blob)
}

async function transformImage({ imageBuffer }) {
  initClient()

  console.log('  → Subiendo imagen...')
  const imageUrl = await uploadToFal(imageBuffer)
  console.log(`  → OK: ${imageUrl.slice(0, 60)}`)

  console.log('  → Transformando con Flux Pro Kontext...')
  const result = await fal.subscribe('fal-ai/flux-pro/kontext', {
    input: {
      image_url:        imageUrl,
      prompt:           buildPrompt(),
      num_images:       1,
      guidance_scale:   3.5,
      safety_tolerance: '2',
      output_format:    'jpeg',
      aspect_ratio:     '3:4',
    },
    logs: false,
  })

  const outputUrl = result?.data?.images?.[0]?.url
  if (!outputUrl) throw new Error('fal.ai Kontext no devolvió imagen')
  console.log(`  → Resultado: ${outputUrl.slice(0, 60)}`)
  return outputUrl
}

async function transformImageDemo(imageBuffer) {
  console.log('[Demo] Sin FAL_API_KEY — imagen original')
  return `data:image/jpeg;base64,${imageBuffer.toString('base64')}`
}

module.exports = { transformImage, transformImageDemo }
