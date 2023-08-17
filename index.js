const createMainWindow = require('./windows/main');
const createTorrentWorker = require('./windows/webtorrent');
const {updateAuthFile, getConfigData, login} = require('./lib/auth');
const {serverHost} = require('./lib/constants');
const {app, BrowserWindow, ipcMain, screen} = require('electron');
const {initSocket} = require('./lib/socket');

async function handleIsLogged() {
  const {token} = await getConfigData();

  return token; 
}

async function init(mainWindow) {
  const {token} = await getConfigData();

  if (!token)
    return;

  createTorrentWorker();  

  const socket = initSocket(token);

  socket
    .on('storage:update', size => mainWindow.webContents.send('update-storage', size));
}

const getHandler = mainWindow =>  async function handleLogin(_, {email, password}) {
  try {
    const data = await login(email, password);

    if (!data)
      return null;

    await updateAuthFile(data);

    init(mainWindow);

    return data.token;
  } catch(err) {
    return null;
  }
}

const initWindows = async () => {
  const mainWindow = createMainWindow();

  const handleLogin = getHandler(mainWindow);

  ipcMain.handle('serverHost', () => serverHost);
  ipcMain.handle('isLogged', handleIsLogged);
  ipcMain.handle('login', handleLogin);

  init(mainWindow);
}

app.whenReady().then(() => {
  initWindows();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().lenght === 0)
      initWindows();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin')
    app.quit();
})