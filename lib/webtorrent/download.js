const {join} = require('path');
const {initTorrent} = require('./torrent');
const {syncedDir} = require('../constants');

async function downloadFile(filePath, magnet) {
  const client = await initTorrent();

  const localFilePath = join(syncedDir, filePath);
  const splittedPath = localFilePath.split(/\/|\\/);
  const localFileDirPath = splittedPath.slice(0, splittedPath.length - 1).join('/');

  client.add(magnet, {path: join(process.env.TEMP, 'download')}, torrent => {
    torrent.on('done', () => {
      //TODO: Emit done
      //TODO: Delete Torrent
      console.log('Download--------------');
      console.log(torrent.name);
      console.log(torrent.magnetURI);
      torrent.destroy();
    })
  });
}

module.exports = downloadFile;