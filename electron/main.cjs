const { app, BrowserWindow, Menu, shell, ipcMain } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';

// Garde une référence globale de l'objet window
let mainWindow;
let splashWindow;

function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 600,
    height: 400,
    frame: false,
    alwaysOnTop: true,
    transparent: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs')
    },
    icon: path.join(__dirname, 'icons', 'icon.png')
  });

  splashWindow.loadFile(path.join(__dirname, 'splash.html'));

  splashWindow.on('closed', () => {
    splashWindow = null;
  });

  // Fermer le splash après 3 secondes et montrer la fenêtre principale
  setTimeout(() => {
    if (splashWindow) {
      splashWindow.close();
    }
    if (mainWindow) {
      mainWindow.show();
      if (isDev) {
        mainWindow.focus();
      }
    }
  }, 3000);
}

function createWindow() {
  // Créer la fenêtre du navigateur
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.cjs')
    },
    icon: path.join(__dirname, 'icons', 'icon.png'),
    show: false, // Ne pas montrer jusqu'à ce que ready-to-show soit émis
    titleBarStyle: 'default',
    autoHideMenuBar: false
  });

  // Charger l'app
  if (isDev) {
    // Vérifier si le serveur de développement est accessible
    const net = require('net');
    const client = new net.Socket();
    
    client.setTimeout(2000);
    client.connect(5173, 'localhost', () => {
      // Serveur accessible, charger depuis localhost
      mainWindow.loadURL('http://localhost:5173');
      mainWindow.webContents.openDevTools();
      client.destroy();
    });
    
    client.on('error', () => {
      // Serveur non accessible, construire et charger les fichiers statiques
      console.log('Serveur de développement non accessible, construction de l\'application...');
      const { execSync } = require('child_process');
      try {
        execSync('npm run build', { stdio: 'inherit' });
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
      } catch (error) {
        console.error('Erreur lors de la construction:', error);
        // Fallback: essayer de charger les fichiers existants
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
      }
      client.destroy();
    });
    
    client.on('timeout', () => {
      console.log('Timeout: serveur de développement non accessible');
      client.destroy();
      // Construire et charger les fichiers statiques
      const { execSync } = require('child_process');
      try {
        execSync('npm run build', { stdio: 'inherit' });
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
      } catch (error) {
        console.error('Erreur lors de la construction:', error);
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
      }
    });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Montrer la fenêtre quand elle est prête (mais seulement après le splash)
  mainWindow.once('ready-to-show', () => {
    // Ne pas montrer immédiatement, le splash screen s'en charge
  });

  // Émis quand la fenêtre est fermée
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Gérer les liens externes
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Empêcher la navigation vers des sites externes
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    
    if (parsedUrl.origin !== 'http://localhost:5173' && parsedUrl.origin !== 'file://') {
      event.preventDefault();
    }
  });
}

// Cette méthode sera appelée quand Electron aura fini de s'initialiser
app.whenReady().then(() => {
  // Créer d'abord le splash screen
  createSplashWindow();
  
  // Puis créer la fenêtre principale (cachée)
  createWindow();

  // Créer le menu de l'application
  createMenu();

  app.on('activate', () => {
    // Sur macOS, il est commun de re-créer une fenêtre quand l'icône du dock est cliquée
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quitter quand toutes les fenêtres sont fermées
app.on('window-all-closed', () => {
  // Sur macOS, il est commun pour les applications et leur barre de menu
  // de rester actives jusqu'à ce que l'utilisateur quitte explicitement avec Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Créer le menu de l'application
function createMenu() {
  const template = [
    {
      label: 'Fichier',
      submenu: [
        {
          label: 'Nouvelle Partie',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.send('new-game');
          }
        },
        { type: 'separator' },
        {
          label: 'Quitter',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Édition',
      submenu: [
        { role: 'undo', label: 'Annuler' },
        { role: 'redo', label: 'Rétablir' },
        { type: 'separator' },
        { role: 'cut', label: 'Couper' },
        { role: 'copy', label: 'Copier' },
        { role: 'paste', label: 'Coller' }
      ]
    },
    {
      label: 'Affichage',
      submenu: [
        { role: 'reload', label: 'Actualiser' },
        { role: 'forceReload', label: 'Actualiser (forcé)' },
        { role: 'toggleDevTools', label: 'Outils de développement' },
        { type: 'separator' },
        { role: 'resetZoom', label: 'Zoom normal' },
        { role: 'zoomIn', label: 'Zoom avant' },
        { role: 'zoomOut', label: 'Zoom arrière' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Plein écran' }
      ]
    },
    {
      label: 'Fenêtre',
      submenu: [
        { role: 'minimize', label: 'Réduire' },
        { role: 'close', label: 'Fermer' }
      ]
    },
    {
      label: 'Aide',
      submenu: [
        {
          label: 'À propos de Tetris Revolution',
          click: () => {
            mainWindow.webContents.send('show-about');
          }
        },
        {
          label: 'Raccourcis clavier',
          click: () => {
            mainWindow.webContents.send('show-shortcuts');
          }
        }
      ]
    }
  ];

  // Ajustements pour macOS
  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        { role: 'about', label: 'À propos de ' + app.getName() },
        { type: 'separator' },
        { role: 'services', label: 'Services' },
        { type: 'separator' },
        { role: 'hide', label: 'Masquer ' + app.getName() },
        { role: 'hideothers', label: 'Masquer les autres' },
        { role: 'unhide', label: 'Tout afficher' },
        { type: 'separator' },
        { role: 'quit', label: 'Quitter ' + app.getName() }
      ]
    });

    // Fenêtre menu
    template[4].submenu = [
      { role: 'close', label: 'Fermer' },
      { role: 'minimize', label: 'Réduire' },
      { role: 'zoom', label: 'Zoom' },
      { type: 'separator' },
      { role: 'front', label: 'Tout ramener au premier plan' }
    ];
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// Gérer les événements IPC
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('get-platform', () => {
  return process.platform;
});

// Empêcher la création de plusieurs instances
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    // Quelqu'un a essayé de lancer une seconde instance, on focus notre fenêtre à la place
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}
