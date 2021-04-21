'use strict';

// defined some global env.
global.isDev = () => process.env.NODE_ENV === 'development';

module.exports = app => {
  app.beforeStart(async function() {
    console.log('server start success=====');

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
};
