const {ipcRenderer} = require('electron')

const updateOnlineStatus = () => {
  ipcRenderer.send('online-status-changed', navigator.onLine ? 'online' : 'offline')
}

window.addEventListener('online', updateOnlineStatus)
window.addEventListener('offline', updateOnlineStatus)

updateOnlineStatus()

if (!navigator.onLine) {
  changeMessage('Desconectado <i class="fa fa-bolt" aria-hidden="true"></i>')
} else {
  changeMessage('Verificando <i class="fa fa-spinner fa-pulse" aria-hidden="true"></i>')
}

window.addEventListener('offline', function (e) {
  changeMessage('Desconectado <i class="fa fa-bolt" aria-hidden="true"></i>')
})

ipcRenderer.on('changeMessage', (event, html) => {
  changeMessage(html)
})

function changeMessage (html = '') {
  document.getElementById('message').innerHTML = html
}
