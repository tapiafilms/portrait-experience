require('dotenv').config({ path: require('path').join(__dirname, '../.env'), override: true })
const express = require('express')
const cors = require('cors')
const path = require('path')
const captureRouter = require('./routes/capture')
const sessionRouter = require('./routes/session')
const transformRouter = require('./routes/transform')
const photographerRouter = require('./routes/photographer')
const assistantRouter = require('./routes/assistant')

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors())
app.use(express.json({ limit: '50mb' }))

// Servir imágenes capturadas
app.use('/uploads', express.static(path.join(__dirname, 'storage/uploads')))

app.use('/api', captureRouter)
app.use('/api', sessionRouter)
app.use('/api', transformRouter)
app.use('/api', photographerRouter)
app.use('/api', assistantRouter)

app.get('/health', (_, res) => res.json({ status: 'ok', ts: Date.now() }))

app.listen(PORT, () => {
  console.log(`\n  Genofy Portrait Server  →  http://localhost:${PORT}\n`)
})
