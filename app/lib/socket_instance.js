'use strict';

// const socket = require('socket.io-client')('http://localhost:6700?access_token=eVkXCLVZufjjut5TQQTUE7R-');
// const io = require('socket.io-client');
const W3CWebSocket = require('websocket').w3cwebsocket;


class SocketClient {
  constructor() {
    this.client = null;
  }

  init(ip) {
    this.client = new W3CWebSocket(`ws://${ip}:6700`, undefined, {
      fragmentOutgoingMessages: false,
    });

    // this.event = new W3CWebSocket('ws://localhost:6700/event', undefined, {
    //   fragmentOutgoingMessages: false,
    // });
    // this.socket = io('http://localhost:6700/api', {
    // });
  }

  getInstance(ip) {
    this.init(ip);
    return this.client;
  }
}

module.exports = new SocketClient();

