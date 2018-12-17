'use strict';
const axios = require('axios');
const util = require('./app/lib/utils');

module.exports = app => {
  app.beforeStart(async function() {
    console.log('server start success=====');
    // 发送一个`POST`请求 http://localhost:5700/send_group_msg?group_id=947218914&message=test
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
      console.log('初始化长链接失败======', error);
      process.exit(1);
    }

    try {
      await app.getEvent();
    } catch (error) {
      console.log('长链接获取事件失败======', error);
      process.exit(1);
    }

  });

  const consoleLog = console.log;

  console.log = function(...args) {
    consoleLog.apply(app.logger, args);
  };

  app = Object.assign(app, util);


  const file = __dirname + '/db/config.json';
  app.initDbConfig(file);
};
