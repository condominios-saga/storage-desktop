const {mkdir, exists} = require('fs');
const chokidar = require('chokidar');
const {getConfigData} = require('../auth');
const {syncedDir} = require('../constants');

let token = null;

async function initWatcher() {

  const watcher = chokidar.watch(syncedDir, {ignored: /^\./, persistent: true});

  await new Promise((resolve, reject) => {
    exists(syncedDir, existsDir => {
      if (existsDir)
        return resolve();

      mkdir(syncedDir, {recursive: true}, (err, res) => err ? reject(err) : resolve(res));
    })
  });

  return watcher
}

module.exports = exports = {
  initWatcher
}
