const {BrowserWindow} = require('electron');
const {join} = require('path');

const createWindow = () => {
  const torrentWindow = new BrowserWindow({
    backgroundColor: '#1E1E1E',
    center: true,
    fullscreen: false,
    fullscreenable: false,
    height: 150,
    maximizable: false,
    minimizable: false,
    resizable: false,
    show: true,
    skipTaskbar: true,
    title: 'webtorrent-client',
    useContentSize: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      backgroundThrottling: false
    },
    width: 150
  });

  torrentWindow.loadFile(join(__dirname, '../static/webtorrent.html'));

  return torrentWindow;
}

module.exports = createWindow;