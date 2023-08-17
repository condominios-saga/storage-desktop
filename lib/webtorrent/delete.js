const {exists} = require('fs');
const axios = require('axios');
const {join} = require('path');
const {filterPath} = require('./utils');
const {syncedDir, serverHost} = require('../constants');

const deletionEnqueue = [];
let deletionIsStarted = false;

async function startDeletionEnqueue(token) {
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

    await startDeletionEnqueue(token);
  } catch(err) {
    deletionEnqueue.push(actualDeletion);

    setTimeout(async () => {
      await startDeletionEnqueue(token);
    }, 5000);
  }
}

const deleteFile = token => async function enqueueDeletion(filePath) {
  const relativeFilePath = filterPath(filePath);

  deletionEnqueue.push(relativeFilePath);

  if (deletionIsStarted)
    return;

  await startDeletionEnqueue(token);
}

function handleDeleteFile({path}) {
  const fullPath = join(syncedDir, path);

  exists(fullPath, existsFile => {
    if (existsFile) {
      //TODO: Remove Files
    }
  })
}


module.exports = exports = {
  deleteFile,
  handleDeleteFile
}
