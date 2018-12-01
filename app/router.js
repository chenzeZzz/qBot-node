'use strict';

module.exports = app => {
  const { router, controller, io } = app;
  router.get('/', controller.home.index);

  // socket.io
  // of 选择/是什么意思啊
  io.of('api').route('chat', io.controller.chat.ping);
  io.of('/').route('disconnect', app.io.controller.chat.disconnect);
};

