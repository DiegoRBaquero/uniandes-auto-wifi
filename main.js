const {app, BrowserWindow, Tray, Menu, nativeImage, ipcMain} = require('electron')
const path = require('path')
const url = require('url')
const isOnline = require('is-online')
const Config = require('electron-config')
const config = new Config()

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow
let tray
let contextMenu
let interval
let sleeping = false

app.dock.hide()

function createWindow (show = false) {
  if (mainWindow !== undefined) mainWindow.close()
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 260,
    height: 160,
    show: show,
    resizable: false,
    maximizable: false,
    fullscreenable: false,
    title: 'Uniandes Auto Wi-Fi',
    backgroundColor: '#fff200',
    webPreferences: {
      defaultFontFamily: 'sansSerif'
    }
  })

  // and load the index.html of the app.
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'views/index.html'),
    protocol: 'file:',
    slashes: true
  }))

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    console.log('closed window')
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = undefined
  })
}

function createTray () {
  tray = new Tray(nativeImage.createFromPath(path.join(__dirname, 'img','logo.png')))
  contextMenu = Menu.buildFromTemplate([
    { label: 'Abrir',
      click () {
        if (mainWindow === undefined) {
          createWindow()
        }
        toggleSleep(false)
        mainWindow.show()
      }
    },
    { label: 'Dormir',
      type: 'checkbox',
      click () {
        toggleSleep(!sleeping)
      }
    },
    { label: 'Configurar',
      click () {
        createConfigWindow()
      }
    },
    { label: '',
      type: 'separator'
    },
    { role: 'quit' }
  ])

  tray.on('click', () => {
    console.log('dclick')
    if (mainWindow !== undefined) {
      mainWindow.show()
    } else {
      createWindow()
    }
  })

  // Call this again for Linux because we modified the context menu
  tray.setToolTip('Uniandes Auto Wi-Fi')
  tray.setContextMenu(contextMenu)
}

function createConfigWindow () {
  if (mainWindow !== undefined) mainWindow.close()
  mainWindow = new BrowserWindow({
    width: 260,
    height: 300,
    resizable: true,
    maximizable: false,
    fullscreenable: false,
    title: 'Uniandes Auto Wi-Fi - Configuración',
    backgroundColor: '#fff200',
    webPreferences: {
      defaultFontFamily: 'sansSerif'
    }
  })

  // and load the index.html of the app.
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'views/config.html'),
    protocol: 'file:',
    slashes: true
  }))

  // Open the DevTools.
  mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    console.log('closed window')
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = undefined
    createWindow(true)
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  createTray()
  // let usuario
  if ((usuario = config.get('usuario'))) {
    console.log(usuario)
    createWindow()
  } else {
    createConfigWindow()
  }
})

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  console.log('Windows closed')
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
function checkInternet () {
  testInternet()
  if (interval !== undefined) clearInterval(interval)
  interval = setInterval(testInternet, 10000)
}

function testInternet () {
  console.log('testInternet()')
  isOnline({ timeout: 5000 }).then(online => {
    if (!online) {
      console.log('testInternet() not online')
      connect()
    } else {
      console.log('testInternet() online')
      clearInternetInterval()
      updateDormir(true)
      if (mainWindow !== undefined) mainWindow.webContents.send('changeMessage', 'Conectado <i class="fa fa-wifi" aria-hidden="true"></i>')
    }
  }).catch(e => {
    console.error(e)
  })
}

function connect () {
  console.log('connect()')
  const request = require('request')

  if (mainWindow !== undefined) mainWindow.webContents.send('changeMessage', 'Conectando <i class="fa fa-spinner fa-pulse" aria-hidden="true"></i>')

  const options = {
    method: 'POST',
    url: 'https://wlan.uniandes.edu.co/login.html',
    headers: {
      connection: 'keep-alive',
      referer: 'https://wlan.uniandes.edu.co/fs/customwebauth/login.html?switch_url=https://wlan.uniandes.edu.co/login.html',
      'content-type': 'application/x-www-form-urlencoded',
      origin: 'https://wlan.uniandes.edu.co'
    },
    form: {
      buttonClicked: '4',
      redirect_url: '',
      err_flag: '0',
      info_flag: '0',
      info_msg: '0',
      username: config.get('usuario'),
      password: config.get('password')
    }
  }

  request(options, function (error, response, body) {
    if (error) return console.trace(error)
    console.log('connect() no error')
    if (body.includes('successful')) {
      if (mainWindow !== undefined) mainWindow.webContents.send('changeMessage', 'Conectado <i class="fa fa-wifi" aria-hidden="true"></i>')
    } else {
      if (mainWindow !== undefined) mainWindow.webContents.send('changeMessage', 'Fallé')
    }
  })
}

function toggleSleep (value = false) {
  console.log('toggleSleep()', value)
  sleeping = value
  if (value) {
    if (mainWindow !== undefined) {
      mainWindow.close()
      mainWindow = undefined
    }
    clearInternetInterval()
  } else {
    checkInternet()
  }
  updateDormir(value)
}

function clearInternetInterval () {
  clearInterval(interval)
  interval = undefined
}

function updateDormir (value) {
  contextMenu.items[1].checked = value

  // Call this again for Linux because we modified the context menu
  tray.setContextMenu(contextMenu)
}

ipcMain.on('online-status-changed', (event, status) => {
  console.log('received status change', status)
  if (config.get('usuario') === undefined) return
  if (status === 'offline') clearInterval(interval)
  else checkInternet()
})
