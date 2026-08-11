import { app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { getDb, closeDb } from './db/index.js'
import { createUser, verifyLogin, hasAnyUser } from './auth/auth.js'
import {
  ensureDefaultTemplate,
  getDefaultTemplate,
  getTemplate,
  listTemplates,
  createTemplate,
  updateTemplate,
  setDefaultTemplate,
  deleteTemplate,
  validateFieldSchema
} from './templates/templates.js'
import {
  createEntry,
  listEntries,
  getEntry,
  updateEntry,
  deleteEntry,
  searchEntries
} from './entries/entries.js'

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

  ipcMain.handle('templates:getDefault', () => getDefaultTemplate())

  ipcMain.handle('templates:list', () => listTemplates())

  ipcMain.handle('templates:create', (_event, { name, fieldSchema } = {}) => {
    if (typeof name !== 'string' || !name.trim()) {
      return { success: false, error: 'Template name is required.' }
    }
    const schemaError = validateFieldSchema(fieldSchema)
    if (schemaError) {
      return { success: false, error: schemaError }
    }
    return { success: true, template: createTemplate({ name: name.trim(), fieldSchema }) }
  })

  ipcMain.handle('templates:update', (_event, { id, name, fieldSchema } = {}) => {
    if (typeof name !== 'string' || !name.trim()) {
      return { success: false, error: 'Template name is required.' }
    }
    const schemaError = validateFieldSchema(fieldSchema)
    if (schemaError) {
      return { success: false, error: schemaError }
    }
    const template = updateTemplate(id, { name: name.trim(), fieldSchema })
    if (!template) {
      return { success: false, error: 'Template not found.' }
    }
    return { success: true, template }
  })

  ipcMain.handle('templates:setDefault', (_event, id) => {
    const template = setDefaultTemplate(id)
    if (!template) {
      return { success: false, error: 'Template not found.' }
    }
    return { success: true, template }
  })

  ipcMain.handle('templates:delete', (_event, id) => deleteTemplate(id))

  ipcMain.handle('entries:create', (_event, { templateId, data, createdBy } = {}) => {
    const validationError = validateEntryData(templateId, data)
    if (validationError) {
      return { success: false, error: validationError }
    }
    return { success: true, entry: createEntry({ templateId, data, createdBy }) }
  })

  ipcMain.handle('entries:list', () => listEntries())

  ipcMain.handle('entries:get', (_event, id) => getEntry(id))

  ipcMain.handle('entries:update', (_event, { id, templateId, data } = {}) => {
    const validationError = validateEntryData(templateId, data)
    if (validationError) {
      return { success: false, error: validationError }
    }
    const entry = updateEntry(id, data)
    if (!entry) {
      return { success: false, error: 'Entry not found.' }
    }
    return { success: true, entry }
  })

  ipcMain.handle('entries:delete', (_event, id) => ({ success: deleteEntry(id) }))

  ipcMain.handle('entries:search', (_event, keyword) => searchEntries(keyword))
}

// Checks the entry data against its template's required fields (the
// template referenced by templateId, or the default template if none was
// given). Falls back to just requiring a non-empty `name` if no template can
// be found at all, so entry creation still works without a template.
function validateEntryData(templateId, data) {
  if (!data || typeof data !== 'object') {
    return 'Entry data is required.'
  }

  const template = (templateId ? getTemplate(templateId) : null) ?? getDefaultTemplate()
  const requiredFields = template?.field_schema?.filter((field) => field.required) ?? [
    { key: 'name', label: 'Name' }
  ]

  for (const field of requiredFields) {
    const value = data[field.key]
    if (typeof value !== 'string' || !value.trim()) {
      return `${field.label} is required.`
    }
  }

  return null
}

app.whenReady().then(() => {
  getDb() // opens the local database and applies schema on startup
  ensureDefaultTemplate()
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
