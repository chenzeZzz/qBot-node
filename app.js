'use strict';
const axios = require('axios');
const util = require('./app/lib/utils');

module.exports = app => {
  app.beforeStart(async function() {
    console.log('server start success=====');
    // 发送一个`POST`请求 http://localhost:5700/send_group_msg?group_id=947218914&message=test
    await axios({
      method: 'POST',
      url: 'http://localhost:5700/send_group_msg',
      data: {
        group_id: app.config.group_id_test,
        message: '启用LYJ机器人',
      },
    });

    // 初始化 ws
    try {
      await app.initWs();
    } catch (error) {
      console.log('初始化长链接失败======', error);
      process.exit(0);
    }


  });

  global.log = console.log;

  app = Object.assign(app, util);


  const file = __dirname + '/db/config.json';
  app.initDbConfig(file);
  // app.syncDb(file);
};
