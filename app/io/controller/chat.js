'use strict';

const Controller = require('egg').Controller;

class Chat extends Controller {
  async ping() {
    console.log('====xixixi===');
    const { ctx, app } = this;
    const message = ctx.args[0];
    await ctx.socket.emit('qbotWs', `Hi! I've got your message: ${message}`);
  }

  async disconnect() {
    const message = this.ctx.args[0];
    console.log('disconnect=====', message);
  }
}

module.exports = Chat;
