const {join} = require('path');
const {initTorrent} = require('./torrent');
const {syncedDir} = require('../constants');

async function downloadFile(filePath, magnet) {
  const client = initTorrent();

  const torrent = client.get(magnet);
  console.log(torrent)
  
  if (torrent)
    return;

  const localFilePath = join(syncedDir, filePath);
  const splittedPath = localFilePath.split(/\/|\\/);
  const localFileDirPath = splittedPath.slice(0, splittedPath.length - 1).join('/');

  client.add(magnet, {path: localFilePath}, torrent => {
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
