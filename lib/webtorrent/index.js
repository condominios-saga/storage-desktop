const {exists, writeFileSync, createReadStream, createWriteStream} = require('fs');
const {updateFile, handleUpdateFile} = require('./update');
const {deleteFile, handleDeleteFile} = require('./delete');
const {syncedDir, serverHost} = require('../constants');
const {getConfigData} = require('../auth');
const downloadFile = require('./download');
const {initTorrent} = require('./torrent');
const {initSocket} = require('../socket');
const {initWatcher} = require('./files');
const uploadFile = require('./upload');
const {join} = require('path');
const axios = require('axios');

let token = null;

const torrent = initTorrent();

async function generateMagnet({device, path}) {
  const fileResonse = await axios.get(`${serverHost}/file/${filePath}?type=raw`, {
    headers: {
      authorization: `Bearer ${token}`
    }
  });

  const fileDownload = fileResonse.data.pipe(createWriteStream(filePath));

  await new Promise(resolve => fileDownload.on('end', resolve));

  const relativeFilePath = filterPath(filePath);
  const splitted = relativeFilePath.split(/\/|\\/g);

  torrent.seed(createReadStream(filePath), {name: splitted[splitted.length - 1]}, async torrent => {
    if (!magnet) {
      await axios.patch(`${serverHost}/file/magnets`, {
        headers: {
          authorization: `Bearer ${token}`
        },
        data: {
          filePath,
          magnet: torrent.magnetURI,
          device
        }
      });
    }
  });
}

async function syncFiles() {
  const {device: actualDevice} = await getConfigData();

  const listResponse = await axios.get(`${serverHost}/file/magnets`, {
    headers: {
      authorization: `Bearer ${token}`
    }
  });

  const {data} = listResponse.data;

  data.forEach(async ({filePath, magnet, device}) => {
    if (!magnet)
      return generateMagnet({device, path: filePath});

    return downloadFile(filePath, magnet);
  });
}

function handleNewFile({path, magnet}) {
  downloadFile(path, magnet);
}

async function startSync() {
  const {token: authToken} = await getConfigData();

  if (!authToken)
    return;

  token = authToken;

  const uploadHandler = uploadFile(token);
  const updateHandler = updateFile(token);
  const deleteHandler = deleteFile(token);
  
  syncFiles();
  
  const socket = initSocket(token);
  const watcher = await initWatcher();

  watcher
    .on('add', uploadHandler)
    .on('change', updateHandler)
    .on('unlink', deleteHandler);

  socket
    .on('file:new', handleNewFile)
    .on('magnet:generate', generateMagnet)
    .on('file:update', handleUpdateFile)
    .on('file:delete', handleDeleteFile);
}

process.on('uncaughtException', function(err) {
  writeFileSync('crash.log', err + "\n" + err.stack);

  app.relaunch({args: []});
  app.exit(0);
});

//Wait 5s to start sync
setTimeout(startSync, 5000);

