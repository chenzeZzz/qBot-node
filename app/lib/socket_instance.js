'use strict';

// const socket = require('socket.io-client')('http://localhost:6700?access_token=eVkXCLVZufjjut5TQQTUE7R-');
// const io = require('socket.io-client');
const W3CWebSocket = require('websocket').w3cwebsocket;


class SocketClient {
  constructor() {
    this.client = null;
    // this.event = null;
    this.init();
  }

  init() {
    this.client = new W3CWebSocket('ws://47.99.165.165:6700', undefined, {
      fragmentOutgoingMessages: false,
    });

    // this.event = new W3CWebSocket('ws://localhost:6700/event', undefined, {
    //   fragmentOutgoingMessages: false,
    // });
    // this.socket = io('http://localhost:6700/api', {
    // });
  }

  getInstance() {
    return this.client;
    // return [ this.client, this.event ];
  }
}

module.exports = new SocketClient();

