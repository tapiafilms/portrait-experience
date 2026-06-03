const sharp = require('sharp')
const path = require('path')
const fs = require('fs')

// Prepara la imagen para enviar a la IA:
// - Redimensiona a tamaño óptimo para SDXL (1024x1024 o portrait 768x1024)
// - Normaliza calidad y formato
async function prepareForAI(inputPath) {
  const outputPath = inputPath.replace(/(\.\w+)$/, '_prepared.jpg')

  await sharp(inputPath)
    .resize(768, 1024, {
      fit: 'cover',
      position: 'top', // prioriza la cara
    })
    .jpeg({ quality: 95 })
    .toFile(outputPath)

  return outputPath
}

// Guarda un buffer como archivo
async function saveBuffer(buffer, outputPath) {
  await fs.promises.writeFile(outputPath, buffer)
  return outputPath
}

// Convierte imagen a base64 data URL
async function toBase64DataUrl(filePath) {
  const buffer = await fs.promises.readFile(filePath)
  const ext = path.extname(filePath).slice(1) || 'jpeg'
  return `data:image/${ext};base64,${buffer.toString('base64')}`
}

// Convierte base64 data URL a buffer y lo guarda
async function fromBase64DataUrl(dataUrl, outputPath) {
  const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, '')
  const buffer = Buffer.from(base64, 'base64')
  await fs.promises.writeFile(outputPath, buffer)
  return outputPath
}

// Quema el logo Genofy en la esquina inferior derecha de la imagen
async function addWatermark(inputPath, outputPath) {
  const LOGO_PATH = path.join(__dirname, '../../public/logo-genofy-transparent.png')

  const image = sharp(inputPath)
  const meta = await image.metadata()
  const W = meta.width
  const H = meta.height

  // Logo: 22% del ancho de la imagen
  const logoW = Math.round(W * 0.22)

  // Redimensionar logo manteniendo proporción
  const logoResized = await sharp(LOGO_PATH)
    .resize(logoW, null)
    .png()
    .toBuffer()

  const logoMeta = await sharp(logoResized).metadata()
  const padding  = Math.round(W * 0.04)

  // Posición: esquina inferior derecha con padding
  const left = W - logoMeta.width - padding
  const top  = H - logoMeta.height - padding

  await image
    .composite([{
      input: logoResized,
      left,
      top,
      blend: 'over',
    }])
    .jpeg({ quality: 92 })
    .toFile(outputPath)

  return outputPath
}

// Versión buffer — sin disco
async function prepareForAIBuffer(inputBuffer) {
  return sharp(inputBuffer)
    .resize(768, 1024, { fit: 'cover', position: 'top' })
    .jpeg({ quality: 95 })
    .toBuffer()
}

async function addWatermarkBuffer(inputBuffer) {
  const LOGO_PATH = path.join(__dirname, '../../public/logo-genofy-transparent.png')

  const image = sharp(inputBuffer)
  const meta = await image.metadata()
  const W = meta.width
  const H = meta.height

  const logoW = Math.round(W * 0.22)
  const logoResized = await sharp(LOGO_PATH).resize(logoW, null).png().toBuffer()
  const logoMeta = await sharp(logoResized).metadata()
  const padding = Math.round(W * 0.04)
  const left = W - logoMeta.width - padding
  const top  = H - logoMeta.height - padding

  return image
    .composite([{ input: logoResized, left, top, blend: 'over' }])
    .jpeg({ quality: 92 })
    .toBuffer()
}

module.exports = {
  prepareForAI, prepareForAIBuffer,
  addWatermark, addWatermarkBuffer,
  saveBuffer, toBase64DataUrl, fromBase64DataUrl,
}
