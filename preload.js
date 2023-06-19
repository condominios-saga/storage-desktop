const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('utils', {
  isLogged: () => ipcRenderer.invoke('isLogged'),
  serverHost: () => ipcRenderer.invoke('serverHost'),
  login: (email, password) => ipcRenderer.invoke('login', {email, password}),
  onUpdateStorage: cb => ipcRenderer.on('update-storage', cb)
});
