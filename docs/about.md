A desktop and browser space, all in one.

- Control your windows backgrounds and browser new tab in one place.
- Use static images or any web pages (TODO)
- Manage multiple monitors with shared and local settings.
- Switch between day & night modes on a schedule or from the press of a button (TODO)
- Add minimal UI elements of your choice for time, date and weather.

## How it works

- Electron app run the local server, main window and create background windows
- Tray icon allow access to the main window and background windows
- Each screen (monitor or browser window) share the same settings

## Tech stack

- Electron: desktop app
- Svelte kit: client app running in browser and background
- Svelte: frontend for desktop and client apps

#### Dependencies

- Ejs: template engine to render the client
- Sharp: image processing
- Socket.io: real-time communication
- Electron-as-wallpaper: set the wallpaper

### Project structure

- dsk: desktop app
- web: client app running in browser and background
- docs: documentation
