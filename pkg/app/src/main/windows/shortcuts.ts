import { globalShortcut } from 'electron'
import { MainWindow } from './mainWindow'

export function registerGlobalShortcuts(mainWindow: MainWindow) {
  // Register global keyboard shortcut (Ctrl+B) to toggle main window
  try {
    globalShortcut.register('CommandOrControl+B', () => {
      mainWindow.toggle()
    })

    globalShortcut.register('CommandOrControl+Shift+I', () => {
      const win = mainWindow.get()
      if (win && win.isFocused()) {
        win.webContents.toggleDevTools()
      }
    })
  } catch (err) {
    console.error('Failed to register global shortcuts:', err)
  }
}

export function unregisterGlobalShortcuts() {
  try {
    globalShortcut.unregisterAll()
  } catch (err) {
    console.error('Failed to unregister global shortcuts:', err)
  }
}
