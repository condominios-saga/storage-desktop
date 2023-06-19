const {updateAuthFile, getConfigData, login, existsAuthFile} = require('./lib/auth');
const {serverHost} = require('./lib/constants');
const {startSync} = require('./lib/sync');
const {app, BrowserWindow, ipcMain, screen} = require('electron');
const {join} = require('path');

async function initSync(mainWindow) {
  const {socket} = await startSync();
    
  socket.on('storage:update', size => mainWindow.webContents.send('update-storage', size))
}

const createWindow = async () => {
  let display = screen.getPrimaryDisplay();
  let width = display.bounds.width;

  const mainWindow = new BrowserWindow({
    width: 400,
    height: 600,
    x: width - 400,
    y: 0,
    resizable: false,
    frame: false,
    webPreferences: {
      preload: join(__dirname, 'preload.js')
    },
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#6c63ff',
      symbolColor: '#fff'
    }
  });

  ipcMain.handle('serverHost', () => serverHost);

  ipcMain.handle('isLogged', async () => {
    const {token} = await getConfigData();

    return token; 
  });

  ipcMain.handle('login', async (_, {email, password}) => {
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
  });

  const {token} = await getConfigData();

  if (token)
    initSync(mainWindow);

  mainWindow.loadFile(join(__dirname, 'static/index.html'));
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().lenght === 0)
      createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin')
    app.quit();
})