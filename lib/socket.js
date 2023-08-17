const {serverHost} = require('./constants');
const {io} = require('socket.io-client');

let socket = null;

const initSocket = token => {
  if (!socket)
    socket = io(serverHost, {
      auth: {
        token
      }
    });

  return socket;
}

module.exports = exports = {
  initSocket
}
