const { contextBridge, ipcRenderer } = require('electron');

// Exposer des APIs protégées au contexte du rendu
contextBridge.exposeInMainWorld('electronAPI', {
  // Informations sur l'application
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getPlatform: () => ipcRenderer.invoke('get-platform'),
  
  // Événements du menu
  onNewGame: (callback) => ipcRenderer.on('new-game', callback),
  onShowAbout: (callback) => ipcRenderer.on('show-about', callback),
  onShowShortcuts: (callback) => ipcRenderer.on('show-shortcuts', callback),
  
  // Nettoyer les listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
  
  // Vérifier si on est dans Electron
  isElectron: true,
  
  // Environnement
  isDev: process.env.NODE_ENV === 'development'
});

// Exposer des utilitaires pour détecter l'environnement desktop
contextBridge.exposeInMainWorld('desktop', {
  isDesktop: true,
  platform: process.platform,
  version: process.versions.electron
});
