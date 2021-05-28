'use strict';

const Subscription = require('egg').Subscription;

const taobaHttp = require('../lib/taobaHttp');

class UpdateCache extends Subscription {
  // 通过 schedule 属性来设置定时任务的执行间隔等配置
  static get schedule() {
    return {
      disable: process.env.NODE_ENV !== 'development',
      interval: '10m', // 1 分钟间隔
      immediate: false,
      type: 'worker', // 指定所有的 worker 都需要执行
    };
  }

  // subscribe 是真正定时任务执行时被运行的函数
  async subscribe() {
    const { config } = this;

    console.log('拉取当日股票收盘价。');
    // await this.service.message.spiderOneRoom(config.roomId, config.ownerId, config.target_name);
    // const msg = [
    //   {
    //     type: 'image',
    //     data: {
    //       cache: 0,
    //       url: 'https://ss1.bdstatic.com/70cFvXSh_Q1YnxGkpoWK1HF6hhy/it/u=2002518753,3591507932&fm=26&gp=0.jpg',
    //     },
    //   },
    // ];
    const url = 'https://nim.nosdn.127.net/NDA5MzEwOA==/bmltYV83MjUxODEzNzczXzE2MTc4NDYwNDk2MzNfOTZkOWMyZTEtNTlhNi00ZTZlLTg1ZjgtYWU1YWVkM2VkYjNi';
    // const msg = `[CQ:image,file=${url}]`;

    // const msg =
    //         '内容:\n' +
    //         `[CQ:image,file=${url}] \n`;

    // this.app.errLog(msg);

    try {

      const result = await taobaHttp.getRankInfoFromTaoba(config.taoba.taobaId, config);
      console.log('result===', result);
    } catch (error) {
      console.log('error===', error);

    }
  }


}

module.exports = UpdateCache;
