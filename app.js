'use strict';
const axios = require('axios');
const util = require('./app/lib/utils');

module.exports = app => {
  app.beforeStart(async function() {
    console.log('server start success=====');
    // 发送一个`POST`请求 http://localhost:5700/send_group_msg?group_id=764676099&message=test
    // await axios({
    //   method: 'POST',
    //   url: 'http://47.99.165.165:5700/send_group_msg',
    //   data: {
    //     group_id: app.config.group_id_test,
    //     message: '[CQ:at,qq=836851807]启用LYJ机器人',
    //   },
    // });

    // 初始化 ws
    try {
      await app.initWs();
    } catch (error) {
      console.error('初始化长链接失败======', error);
      process.exit(1);
    }

    try {
      await app.getEvent();
    } catch (error) {
      console.error('长链接获取事件失败======', error);
      process.exit(1);
    }

  });

  // 日志持久化
  console.log = function(...args) {
    app.logger.info.apply(app.logger, args);
  };

  console.warn = function(...args) {
    app.logger.warn.apply(app.logger, args);
  };

  console.error = function(...args) {
    app.logger.error.apply(app.logger, args);
  };


  app = Object.assign(app, util);


  const file = __dirname + '/db/config.json';
  app.initDbConfig(file);
};
