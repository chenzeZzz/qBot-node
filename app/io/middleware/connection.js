'use strict';

module.exports = app => {
  return async (ctx, next) => {
    ctx.socket.emit('qbotWs', 'connected!xixixi');

    return await next();
    // execute when disconnect.
    // console.log('disconnection!');
  };
};
