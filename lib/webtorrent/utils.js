const {syncedDir} = require('../constants');

function filterPath(filePath) {
  return filePath.replace(syncedDir, '').slice(1);
}

module.exports = exports = {
  filterPath
}
