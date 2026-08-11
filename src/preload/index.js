import { contextBridge, ipcRenderer } from 'electron'

// Everything the renderer is allowed to do lives on window.api. No direct
// Node/Electron access is exposed to the renderer beyond this surface.
const api = {
  auth: {
    hasAnyUser: () => ipcRenderer.invoke('auth:hasAnyUser'),
    createFirstUser: (credentials) => ipcRenderer.invoke('auth:createFirstUser', credentials),
    login: (credentials) => ipcRenderer.invoke('auth:login', credentials)
  }
}

contextBridge.exposeInMainWorld('api', api)
