const {createReadStream} = require('fs');
const request = require('request').defaults({jar: true});
const axios = require('axios');
const {initTorrent} = require('./torrent');

let client = null;

const {serverHost} = require('../constants');
const {filterPath} = require('./utils');

//File upload Enqueue
const uploadEnqueue = [];
let uploadIsStarted = false;

async function startUploadEnqueue(token) {
  if (uploadEnqueue.length === 0) {
    uploadIsStarted = false;
    return;
  }
  
  uploadIsStarted = true;

  const actualUpload = uploadEnqueue.shift();

  try {

    const relativeFilePath = filterPath(actualUpload);
    const splitted = relativeFilePath.split(/\/|\\/g);
 
    const magnet = await new Promise(resolve => client.seed(createReadStream(actualUpload),{name: splitted[splitted.length - 1]}, torrent => resolve(torrent.magnetURI)));

    await new Promise((resolve, reject) => {
      request.post({
        url: `${serverHost}/file`,
        headers: {
          authorization: `Bearer ${token}`
        },
        formData: {
          file: createReadStream(actualUpload),
          path: relativeFilePath.replace(/\\/g, '/'),
          magnet,
          type: 'upload'
        }
      }, (err, res, body) => {
        if (err)
          return reject(err);

        return resolve(body);
      });
    });

    await startUploadEnqueue(token);
  } catch(err) {
    console.log('err', err);
    uploadEnqueue.push(actualUpload);

    setTimeout(async () => {
      await startUploadEnqueue(token);
    }, 5000);
  }
}

module.exports = token => async function uploadFile(filePath) {
  client = initTorrent();

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

  await startUploadEnqueue(token);
}
