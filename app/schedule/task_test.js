'use strict';

const Subscription = require('egg').Subscription;

const taobaHttp = require('../lib/taobaHttp');

class UpdateCache extends Subscription {
  // 通过 schedule 属性来设置定时任务的执行间隔等配置
  static get schedule() {
    return {
      disable: process.env.NODE_ENV !== 'development',
      interval: '10s', // 1 分钟间隔
      immediate: true,
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
    //       file: 'kky001',
    //       cache: 0,
    //       url: 'https://thumbnail0.baidupcs.com/thumbnail/716a601f3g0e386e7424b29ba66ebe46?fid=2876749203-250528-818421839011267&time=1618405200&rt=yt&sign=FDTAER-DCb740ccc5511e5e8fedcff06b081203-8b0MfZONf7kIWgLCz0oKsTKBf2Q%3D&expires=24h&chkv=0&chkbd=0&chkpc=&dp-logid=2095841588&dp-callid=0&size=c200_u200&quality=91&vuk=-&ft=video',
    //     },
    //   },
    // ];
    // // '[CQ:image,file=kky/haha.image]';
    // this.app.errLog(msg);

    try {

      const result = await taobaHttp.getRankInfoFromTaoba(config);
      console.log('result===', result);
    } catch (error) {
      console.log('error===', error);

    }
  }


}

module.exports = UpdateCache;
