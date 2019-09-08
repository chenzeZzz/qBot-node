'use strict';

const W3CWebSocket = require('websocket').w3cwebsocket;

class SocketClient {
  constructor() {
    this.client = null;
    this.init();
  }

  init() {
    this.client = new W3CWebSocket('ws://localhost:6700/api', undefined, {
      fragmentOutgoingMessages: false,
    });
    // this.socket = io('localhost:6700/api', {
    // });
  }

  getInstance() {
    return this.client;
  }
}

module.exports = new SocketClient();

