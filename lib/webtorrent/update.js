const {createReadStream} = require('fs');
const {unlink} = require('fs/promises');
const {join} = require('path');
const {syncedDir, serverHost} = require('../constants');
const request = require('request').defaults({jar: true});
const {filterPath} = require('./utils');
const {initTorrent} = require('./torrent');


async function handleUpdateFile({path, magnet}) {
  const client = initTorrent();

  const torrent = client.get(magnet);
  console.log(torrent);
  
  if (torrent)
    return;

  const localFilePath = join(syncedDir, path);
  const splittedPath = localFilePath.split(/\/|\\/);
  const localFileDirPath = splittedPath.slice(0, splittedPath.length - 1).join('/');

  await unlink(localFilePath);

  client.add(magnet, {path: localFileDirPath}, torrent => {
    torrent.on('done', () => {
      //TODO: Emit done
      //TODO: Delete Torrent
      console.log('Update--------------');
      console.log(torrent.name);
      console.log(torrent.magnetURI);
      torrent.destroy();
    })
  });
}

const updateFile = token => async function handleUpdate(filePath) {
  try {
    const client = await initTorrent();

    const body = new FormData();

    const relativeFilePath = filterPath(filePath);
    const splitted = relativeFilePath.split(/\/|\\/g);
 
    const magnet = await new Promise(resolve => client.seed(createReadStream(filePath), {name: splitted[splitted.length - 1]}, torrent => resolve(torrent.magnetURI)));

    await new Promise((resolve, reject) => {
      request.post({
        url: `${serverHost}/file`,
        headers: {
          authorization: `Bearer ${token}`
        },
        formData: {
          file: createReadStream(filePath),
          path: relativeFilePath.replace(/\\/g, '/'),
          magnet,
          type: 'update'
        }
      }, (err, res, body) => {
        if (err)
          return reject(err);

        return resolve(body);
      });
    });
  } catch(err) {
    return Promise.reject(err);
  }
}

module.exports = exports = {
  handleUpdateFile,
  updateFile
};
