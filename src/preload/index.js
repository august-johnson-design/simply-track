import { contextBridge, ipcRenderer } from 'electron'

// Everything the renderer is allowed to do lives on window.api. No direct
// Node/Electron access is exposed to the renderer beyond this surface.
const api = {
  auth: {
    hasAnyUser: () => ipcRenderer.invoke('auth:hasAnyUser'),
    createFirstUser: (credentials) => ipcRenderer.invoke('auth:createFirstUser', credentials),
    login: (credentials) => ipcRenderer.invoke('auth:login', credentials)
  },
  templates: {
    getDefault: () => ipcRenderer.invoke('templates:getDefault'),
    list: () => ipcRenderer.invoke('templates:list'),
    create: (payload) => ipcRenderer.invoke('templates:create', payload),
    update: (payload) => ipcRenderer.invoke('templates:update', payload),
    setDefault: (id) => ipcRenderer.invoke('templates:setDefault', id),
    delete: (id) => ipcRenderer.invoke('templates:delete', id)
  },
  entries: {
    create: (payload) => ipcRenderer.invoke('entries:create', payload),
    list: () => ipcRenderer.invoke('entries:list'),
    get: (id) => ipcRenderer.invoke('entries:get', id),
    update: (payload) => ipcRenderer.invoke('entries:update', payload),
    delete: (id) => ipcRenderer.invoke('entries:delete', id),
    search: (keyword) => ipcRenderer.invoke('entries:search', keyword)
  }
}

contextBridge.exposeInMainWorld('api', api)
