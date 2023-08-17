const {BrowserWindow, screen} = require('electron');
const {join} = require('path');

let mainWindow = null

const createWindow = () => {
  if (mainWindow)
    return mainWindow;

  let display = screen.getPrimaryDisplay();
  let width = display.bounds.width;

  mainWindow = new BrowserWindow({
    width: 400,
    height: 600,
    x: width - 400,
    y: 0,
    //resizable: false,
    //frame: false,
    webPreferences: {
      preload: join(__dirname, '../preload.js')
    },
    //titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#6c63ff',
      symbolColor: '#fff'
    }
  });

  mainWindow.loadFile(join(__dirname, '../static/index.html'));

  return mainWindow;
}

module.exports = createWindow;
