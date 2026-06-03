const Replicate = require('replicate')
const fs = require('fs')

// Modelos disponibles por estilo
// Todos usan SDXL + IPAdapter para preservar identidad facial
const STYLE_MODELS = {
  hollywood: {
    model: 'stability-ai/sdxl:7762fd07cf82c948538e41f63f77d685e02b063e37ec5475f1cd579',
    promptTemplate: (name) =>
      `cinematic Hollywood portrait of ${name || 'a person'}, dramatic studio lighting, film noir atmosphere, editorial magazine cover, ultra sharp, 8k, photorealistic`,
  },
  forbes: {
    model: 'stability-ai/sdxl:7762fd07cf82c948538e41f63f77d685e02b063e37ec5475f1cd579',
    promptTemplate: (name) =>
      `professional executive portrait of ${name || 'a business person'}, Forbes magazine cover style, premium corporate photography, confident pose, soft bokeh background, 8k`,
  },
  vogue: {
    model: 'stability-ai/sdxl:7762fd07cf82c948538e41f63f77d685e02b063e37ec5475f1cd579',
    promptTemplate: (name) =>
      `Vogue fashion editorial portrait of ${name || 'a model'}, high fashion, sophisticated lighting, luxury aesthetic, editorial composition, ultra detailed, 8k`,
  },
  cyberpunk: {
    model: 'stability-ai/sdxl:7762fd07cf82c948538e41f63f77d685e02b063e37ec5475f1cd579',
    promptTemplate: (name) =>
      `cyberpunk neon portrait of ${name || 'a person'}, futuristic dystopian city background, neon lights, tech aesthetic, dramatic shadows, 8k, hyper detailed`,
  },
  spaceceo: {
    model: 'stability-ai/sdxl:7762fd07cf82c948538e41f63f77d685e02b063e37ec5475f1cd579',
    promptTemplate: (name) =>
      `astronaut executive portrait of ${name || 'a person'}, NASA space suit, futuristic space station, stars background, inspirational leadership, 8k photorealistic`,
  },
  noir: {
    model: 'stability-ai/sdxl:7762fd07cf82c948538e41f63f77d685e02b063e37ec5475f1cd579',
    promptTemplate: (name) =>
      `luxury noir black and white portrait of ${name || 'a person'}, high contrast dramatic lighting, mysterious elegant atmosphere, classic cinema style, ultra sharp 8k`,
  },
}

const NEGATIVE_PROMPT =
  'blurry, low quality, distorted face, deformed, ugly, bad anatomy, watermark, text, logo, duplicate, extra limbs, cartoon, anime, painting'

let replicateClient = null

function getClient() {
  if (!replicateClient) {
    const token = process.env.REPLICATE_API_TOKEN
    if (!token) throw new Error('REPLICATE_API_TOKEN no configurado en .env')
    replicateClient = new Replicate({ auth: token })
  }
  return replicateClient
}

async function transformImage({ imagePath, style = 'forbes', userName = null }) {
  const client = getClient()
  const styleConfig = STYLE_MODELS[style] || STYLE_MODELS.forbes

  // Leer imagen como base64
  const imageBuffer = await fs.promises.readFile(imagePath)
  const base64Image = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`

  const output = await client.run(styleConfig.model, {
    input: {
      prompt: styleConfig.promptTemplate(userName),
      negative_prompt: NEGATIVE_PROMPT,
      image: base64Image,
      strength: 0.65,        // 0.6–0.7: preserva identidad sin perder estilo
      guidance_scale: 7.5,
      num_inference_steps: 30,
      width: 768,
      height: 1024,
    },
  })

  // Replicate devuelve array de URLs o una URL directa
  const resultUrl = Array.isArray(output) ? output[0] : output
  if (!resultUrl) throw new Error('Replicate no devolvió imagen')

  return resultUrl
}

// Modo demo: devuelve la imagen original sin transformar
// Se usa cuando no hay API key configurada
async function transformImageDemo(imagePath) {
  console.log('[Demo mode] Replicate no configurado — devolviendo imagen original')
  const buffer = await fs.promises.readFile(imagePath)
  return `data:image/jpeg;base64,${buffer.toString('base64')}`
}

module.exports = { transformImage, transformImageDemo, STYLE_MODELS }
