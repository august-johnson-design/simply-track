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
    getDefault: () => ipcRenderer.invoke('templates:getDefault')
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
