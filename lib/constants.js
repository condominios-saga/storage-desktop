const {join} = require('path');
const os = require('os');

const isDev = process.env.NODE_ENV === 'development';

const homePath = os.homedir();
const isLinux = os.platform() === 'linux';

const syncedDir = join(homePath, isLinux ? '' : 'Documents', 'SAGA Sync');
const configDir = join(process.env.APPDATA || process.env.HOME + (process.platform === 'darwin' ? '/Library/Preferences' : '/.local/share'), 'SAGA');
const crashDumpsDir = join(configDir, 'CrashDumps');
const authFilePath = join(configDir, 'auth.json');
//const serverHost = 'https://www.sagacondominios.com';
const serverHost = 'https://staging-client.sagacondominios.com';

module.exports = exports = {
  syncedDir,
  configDir,
  authFilePath,
  serverHost,
  crashDumpsDir
}