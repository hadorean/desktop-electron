import { app, shell, BrowserWindow, ipcMain, Menu, Tray } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { LocalServer } from './server'
import { BackgroundManager } from './background-manager'

// Track if the app is actually quitting
let isQuitting = false

// Store reference to main window
let mainWindow: BrowserWindow | null = null

// Initialize local server
const localServer = new LocalServer()

// Initialize background manager
let backgroundManager: BackgroundManager | null = null

function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // Close to tray behavior
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault()
      mainWindow?.hide()
    }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  // IPC handlers for server communication
  ipcMain.handle('get-server-url', () => {
    return localServer.getUrl()
  })

  ipcMain.handle('is-server-running', () => {
    return localServer.isServerRunning()
  })

  // IPC handlers for background management
  ipcMain.handle('reload-background', (_, monitorId: number) => {
    if (backgroundManager) {
      backgroundManager.reloadBackground(monitorId)
    }
  })

  ipcMain.handle('reload-all-backgrounds', () => {
    if (backgroundManager) {
      backgroundManager.reloadAllBackgrounds()
    }
  })

  // IPC handlers for background interactivity
  ipcMain.handle('make-background-interactive', (_, monitorId: number) => {
    if (backgroundManager) {
      backgroundManager.makeInteractive(monitorId)
    }
  })

  ipcMain.handle('make-all-backgrounds-interactive', () => {
    if (backgroundManager) {
      backgroundManager.makeAllInteractive()
    }
  })

  ipcMain.handle('make-background-non-interactive', (_, monitorId: number) => {
    if (backgroundManager) {
      backgroundManager.makeNonInteractive(monitorId)
    }
  })

  ipcMain.handle('make-all-backgrounds-non-interactive', () => {
    if (backgroundManager) {
      backgroundManager.makeAllNonInteractive()
    }
  })

  // Start the local server
  localServer
    .start()
    .then(() => {
      // Initialize background manager after server is ready
      backgroundManager = new BackgroundManager()
    })
    .catch((error) => {
      console.error('Failed to start local server:', error)
    })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })

  const tray = new Tray(icon)
  tray.setToolTip('This is my application.')

  // Create tray context menu
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show App',
      click: () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.show()
          mainWindow.focus()
        } else {
          // If main window is destroyed, create a new one
          createWindow()
        }
      }
    },
    {
      label: 'Open in Browser',
      click: () => {
        if (localServer.isServerRunning()) {
          shell.openExternal(localServer.getUrl())
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        console.log('Tray quit clicked - starting cleanup...')
        isQuitting = true
        if (backgroundManager) {
          backgroundManager.cleanup()
        }
        localServer.stop()

        // Force quit after cleanup
        setTimeout(() => {
          console.log('Force quitting from tray...')
          app.exit(0)
        }, 1000)
      }
    }
  ])

  tray.setContextMenu(contextMenu)

  // Double click tray icon to show window
  tray.on('double-click', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.show()
      mainWindow.focus()
    } else {
      // If main window is destroyed, create a new one
      createWindow()
    }
  })
})

// Handle app quit events to ensure proper cleanup
app.on('before-quit', () => {
  console.log('App quitting - starting cleanup...')
  isQuitting = true
  if (backgroundManager) {
    backgroundManager.cleanup()
  }
  localServer.stop()
})

// Force quit after a timeout if normal quit doesn't work
app.on('will-quit', () => {
  console.log('App will quit - forcing exit...')
  // Force exit after 1 second if the app is still running
  setTimeout(() => {
    console.log('Forcing app exit...')
    process.exit(0)
  }, 1000)
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (backgroundManager) {
      backgroundManager.cleanup()
    }
    localServer.stop()
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
