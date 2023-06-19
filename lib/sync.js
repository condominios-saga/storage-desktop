const {mkdir, createReadStream, createWriteStream, exists} = require('fs');
const FormData = require('form-data');
const chokidar = require('chokidar');
const axios = require('axios');
const {join} = require('path');

let token = null;

const {getConfigData} = require('./auth');
const {syncedDir, serverHost} = require('./constants');
const {initSocket} = require('./socket');

//File upload Enqueue
const uploadEnqueue = [];
let uploadIsStarted = false;


const deletionEnqueue = [];
let deletionIsStarted = false;

function filterPath(filePath) {
  return filePath.replace(syncedDir, '').slice(1);
}

async function startUploadEnqueue() {
  if (uploadEnqueue.length === 0) {
    uploadIsStarted = false;
    return;
  }
  
  uploadIsStarted = true;

  const actualUpload = uploadEnqueue.shift();

  try {
    const body = new FormData();

    const relativeFilePath = filterPath(actualUpload);

    body.append('path', relativeFilePath.replace(/\\/g, '/'));
    body.append('type', 'upload');
    body.append('file', createReadStream(actualUpload));

    const formHeaders = body.getHeaders();

    await axios.post(`${serverHost}/file`, body, {
      headers: {
        ...formHeaders,
        authorization: `Bearer ${token}`
      }
    });

    await startUploadEnqueue();
  } catch(err) {
    uploadEnqueue.push(actualUpload);

    setTimeout(async () => {
      await startUploadEnqueue();
    }, 5000);
  }
}


async function startDeletionEnqueue() {
    if (deletionEnqueue.length === 0) {
    deletionIsStarted = false;
    return;
  }
  
  deletionIsStarted = true;

  const actualDeletion = deletionEnqueue.shift();

  try {
    await axios.delete(`${serverHost}/file/${actualDeletion}`, {
      headers: {
        authorization: `Bearer ${token}`
      }
    });

    await startDeletionEnqueue();
  } catch(err) {
    deletionEnqueue.push(actualDeletion);

    setTimeout(async () => {
      await startDeletionEnqueue();
    }, 5000);
  }
}

async function uploadFile(filePath) {
  const relativeFilePath = filterPath(filePath);

  const existsResponse = await axios.get(`${serverHost}/file/exists/${relativeFilePath}`, {
    headers: {
      authorization: `Bearer ${token}`
    }
  });

  const {exists: existsFile} = existsResponse.data;

  if (existsFile)
    return;

  uploadEnqueue.push(filePath);

  if (uploadIsStarted)
    return;

  await startUploadEnqueue();
}

async function updateFile(filePath) {
  uploadEnqueue.push(filePath);

  if (uploadIsStarted)
    return;

  await startUploadEnqueue();
}

async function syncFiles() {
  const listResponse = await axios.get(`${serverHost}/file`, {
    headers: {
      authorization: `Bearer ${token}`
    }
  });

  const {data, bucket} = listResponse.data;

  data.forEach(e => downloadFile(e.Key, bucket));
}

async function downloadFile(filePath, bucket) {

  const localFilePath = join(syncedDir, filePath);

  exists(localFilePath, existsFile => {
    if (existsFile)
      return;

    const splittedPath = localFilePath.split(/\/|\\/);
    const localFileDirPath = splittedPath.slice(0, splittedPath.length - 1).join('/');

    mkdir(localFileDirPath, {recursive: true}, async (err, data) => {
      if (err)
        throw err;

      const res = await axios.get(`${serverHost}/file/${bucket}/${filePath}?type=raw`, {
        responseType: 'stream'
      });

      res.data.pipe(createWriteStream(localFilePath));
    });
  });  
}


async function deleteFile(filePath) {
  const relativeFilePath = filterPath(filePath);

  deletionEnqueue.push(relativeFilePath);

  if (deletionIsStarted)
    return;

  await startDeletionEnqueue();
}

function handleNewFile({path, bucket}) {
  const fullPath = join(syncedDir, path);

  exists(fullPath, existsFile => {
    if (!existsFile)
      downloadFile(path, bucket);
  })
}

function handleDeleteFile({path}) {
  const fullPath = join(syncedDir, path);

  exists(fullPath, existsFile => {
    if (existsFile) {
      //TODO: Remove Files
    }
  })
}

async function startSync() {
  const {token: authToken} = await getConfigData();

  if (!authToken)
    return;

  token = authToken;

  const watcher = chokidar.watch(syncedDir, {ignored: /^\./, persistent: true});
  
  await syncFiles();
  
  const socket = initSocket(token, handleNewFile, handleDeleteFile);

  watcher
    .on('add', uploadFile)
    .on('change', updateFile)
    .on('unlink', deleteFile);

  return {
    socket,
    watcher
  }
}

module.exports = exports = {
  startSync
}
