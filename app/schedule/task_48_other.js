'use strict';

const Subscription = require('egg').Subscription;


class UpdateCache extends Subscription {
  // 通过 schedule 属性来设置定时任务的执行间隔等配置
  static get schedule() {
    return {
      disable: false,
      interval: '5m', // 1 分钟间隔
      immediate: true,
      type: 'all', // 指定所有的 worker 都需要执行
    };
  }

  // subscribe 是真正定时任务执行时被运行的函数
  async subscribe() {
    const { config } = this.ctx.app;
    console.log(`刷新${config.target_name}的房间内容`);
    // 列出所有要查找的房间
    const rooms = await this.service.room.getAllRooms();
    for (const room of rooms) {
      await this.service.message.spiderOneRoom(room.roomId, room.ownerId, room.ownerName, true);
    }
  }

}

module.exports = UpdateCache;
