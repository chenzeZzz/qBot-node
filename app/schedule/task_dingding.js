'use strict';

const Subscription = require('egg').Subscription;
const axios = require('axios');


class UpdateCache extends Subscription {
  // 通过 schedule 属性来设置定时任务的执行间隔等配置
  static get schedule() {
    return {
      // disable: true,
      cron: '0 30 16 * * 1-5',
      immediate: false,
      type: 'all', // 指定所有的 worker 都需要执行
    };
  }

  // subscribe 是真正定时任务执行时被运行的函数
  async subscribe() {
    await axios({
      method: 'POST',
      url: 'https://oapi.dingtalk.com/robot/send?access_token=cd7e46a1640295ef335eb7aafd3725f32108a20dab3401747fd65c90a192f99d',
      data: {
        msgtype: 'text',
        text: {
          content: '点饭',
        },
        at: {
          isAtAll: true,
        },
      },
    });
  }
}

module.exports = UpdateCache;
