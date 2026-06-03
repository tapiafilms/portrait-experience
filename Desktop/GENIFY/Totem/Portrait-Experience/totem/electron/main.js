const { app, BrowserWindow, ipcMain, session, systemPreferences } = require('electron')
const path = require('path')
const isDev = process.env.NODE_ENV !== 'production'

let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1080,
    height: 1920,
    fullscreen: false,
    backgroundColor: '#0a0a0a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false,
    },
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000')
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('closed', () => { mainWindow = null })
}

app.whenReady().then(async () => {
  // Solicitar permiso de micrófono a macOS (dispara el diálogo del sistema)
  if (process.platform === 'darwin') {
    await systemPreferences.askForMediaAccess('microphone')
  }

  // Aprobar permisos de micrófono automáticamente en la webview
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    const allowed = ['microphone', 'media', 'audioCapture', 'speech-recognition']
    callback(allowed.includes(permission))
  })

  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (mainWindow === null) createWindow()
})

ipcMain.handle('get-config', () => ({
  apiUrl: process.env.API_URL || 'http://localhost:5000',
  baseUrl: process.env.BASE_URL || 'http://localhost:5000',
}))
