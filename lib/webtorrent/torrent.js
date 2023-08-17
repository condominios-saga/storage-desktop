const WebTorrent = require('webtorrent');

let client = null;

function initTorrent() {  
  if (!client)
    client = new WebTorrent();

  return client;
}

module.exports = exports = {
  initTorrent
};
