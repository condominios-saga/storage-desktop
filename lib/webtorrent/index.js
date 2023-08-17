const {join} = require('path');
const {initWatcher} = require('./files');
const {initSocket} = require('../socket');
const {exists, writeFileSync} = require('fs');
const axios = require('axios');
const {getConfigData} = require('../auth');
const {syncedDir, serverHost} = require('../constants');
const uploadFile = require('./upload');
const {updateFile, handleUpdateFile} = require('./update');
const downloadFile = require('./download');
const {deleteFile, handleDeleteFile} = require('./delete');

let token = null;

async function syncFiles() {
  const listResponse = await axios.get(`${serverHost}/file`, {
    headers: {
      authorization: `Bearer ${token}`
    }
  });

  const {data, bucket} = listResponse.data;

  data.forEach(e => downloadFile(e.Key, bucket));
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
  
  //await syncFiles();
  
  const socket = initSocket(token);
  const watcher = await initWatcher();

  watcher
    .on('add', uploadHandler)
    .on('change', updateHandler)
    .on('unlink', deleteHandler);

  socket
    .on('file:new', handleNewFile)
    .on('file:update', handleUpdateFile)
    .on('file:delete', handleDeleteFile);
}

process.on('uncaughtException', function(err) {
  //log the message and stack trace
  writeFileSync('crash.log', err + "\n" + err.stack);

  //do any cleanup like shutting down servers, etc

  //relaunch the app (if you want)
  app.relaunch({args: []});
  app.exit(0);
});

//Wait 5s to start sync
setTimeout(startSync, 5000);

