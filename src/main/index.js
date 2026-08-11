import { app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { getDb, closeDb } from './db/index.js'
import { createUser, verifyLogin, hasAnyUser } from './auth/auth.js'

const isDev = !app.isPackaged

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1100,
    height: 750,
    minWidth: 800,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  if (isDev && process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function registerIpcHandlers() {
  ipcMain.handle('auth:hasAnyUser', () => hasAnyUser())

  ipcMain.handle('auth:createFirstUser', (_event, { username, password } = {}) => {
    if (hasAnyUser()) {
      return { success: false, error: 'A user already exists.' }
    }
    if (!username || !password) {
      return { success: false, error: 'Username and password are required.' }
    }
    const user = createUser(username, password)
    return { success: true, user }
  })

  ipcMain.handle('auth:login', (_event, { username, password } = {}) => {
    if (!username || !password) {
      return { success: false, error: 'Username and password are required.' }
    }
    return verifyLogin(username, password)
  })
}

app.whenReady().then(() => {
  getDb() // opens the local database and applies schema on startup
  registerIpcHandlers()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  closeDb()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
