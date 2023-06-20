const {join} = require('path');
const os = require('os');

const isDev = process.env.NODE_ENV === 'development';

const homePath = os.homedir();
const isLinux = os.platform() === 'linux';

const syncedDir = join(homePath, isLinux ? '' : 'Documents', 'SAGA Sync');
const configDir = join(process.env.APPDATA || process.env.HOME + (process.platform === 'darwin' ? '/Library/Preferences' : '/.local/share'), 'SAGA');
const authFilePath = join(configDir, 'auth.json');
const serverHost = isDev ? 'http://localhost:2020' : 'https://saga-storage.onrender.com';

module.exports = exports = {
  authFilePath,
  configDir,
  syncedDir,
  serverHost
}