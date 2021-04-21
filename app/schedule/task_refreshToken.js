'use strict';

const Subscription = require('egg').Subscription;


class UpdateCache extends Subscription {
  // 通过 schedule 属性来设置定时任务的执行间隔等配置
  static get schedule() {
    return {
      disable: process.env.NODE_ENV === 'development',
      interval: '3m', // 1 分钟间隔
      immediate: true,
      type: 'worker', // 指定所有的 worker 都需要执行
    };
  }

  // subscribe 是真正定时任务执行时被运行的函数
  async subscribe() {
    const { config, ctx } = this;

    // token 写到 db
    console.log('refresh 48 token from db.');
    const token = await ctx.model.Token.findOneById();
    config.pocketToken.token = token;
  }


}

module.exports = UpdateCache;
