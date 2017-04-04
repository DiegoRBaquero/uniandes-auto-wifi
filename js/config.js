const {remote} = require('electron')
const Config = require('electron-config')
const config = new Config()

window.onload = () => {
  let usuario = config.get('usuario')
  if (usuario !== undefined) {
    document.getElementById('usuario').value = config.get('usuario')
    document.getElementById('cancelButton').style = ''
  }
}

document.getElementById('configForm').addEventListener('submit', e => {
  e.preventDefault()
  config.set('usuario', document.getElementById('usuario').value)
  config.set('password', document.getElementById('password').value)
  close()
})

function close () {
  remote.getCurrentWindow().close()
}
