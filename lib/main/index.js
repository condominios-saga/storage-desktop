const {ipcMain} = require('electron');
const {initSocket} = require('../socket');
const {getConfigData} = require('../auth');
const {serverHost} = require('../constants');

async function handleIsLogged() {
  const {token} = await getConfigData();

  return token; 
}

async function handleLogin(_, {email, password}) {
  try {
    const data = await login(email, password);

    if (!data)
      return null;

    await updateAuthFile(data);

    initSync(mainWindow);

    return data.token;
  } catch(err) {
    return null;
  }
}

async function startMain(mainWindow) {
  const {token} = await getConfigData();

  if (!token)
    return;
  
  const socket = initSocket(token);

  socket
    .on('storage:update', size => mainWindow.webContents.send('update-storage', size))

  ipcMain.handle('serverHost', () => serverHost);
  ipcMain.handle('isLogged', handleIsLogged);
  ipcMain.handle('login', handleLogin);
}

module.exports = startMain;
