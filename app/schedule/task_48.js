'use strict';

const Subscription = require('egg').Subscription;
const utils = require('../lib/utils');

class UpdateCache extends Subscription {
  // 通过 schedule 属性来设置定时任务的执行间隔等配置
  static get schedule() {
    return {
      // disable: true,
      interval: '30s', // 1 分钟间隔
      immediate: true,
      type: 'all', // 指定所有的 worker 都需要执行
    };
  }

  // subscribe 是真正定时任务执行时被运行的函数
  async subscribe() {

    console.log(`刷新${this.app.config.target_name}的房间内容`);
    const roomMain = await this.app.getRoomMain();
    roomMain.reverse();
    // console.log('xoxoxoxooxox', roomMain);
    for (const iterator of roomMain) {
      const tmp = JSON.parse(iterator.extInfo);
      // console.log('====', tmp.senderName);
      if (tmp.senderName !== this.app.config.target_name) continue;
      if (this.app.config.config_db.last_room_content_ids.has(iterator.msgidClient)) continue;
      // ids.add(iterator.msgidClient);
      const tmp_array = [ ...(this.app.config.config_db.last_room_content_ids) ];
      tmp_array.splice(0, 0, iterator.msgidClient);
      if (tmp_array.length > 10) { tmp_array.splice(-1, 1); }

      this.app.config.config_db.last_room_content_ids = new Set(tmp_array);
      await this.app.syncDb();
      const msg = utils.dealRoomContent(iterator);

      // console.log('msg====', msg);
      if (!msg) continue;
      this.app.socket_qbot.send(this.app.config.genMsg('send_group_msg', { group_id: this.app.config.group_id, message: msg }));
      // this.app.socket_qbot.send(this.app.config.genMsg('send_private_msg', { user_id: this.app.config.qq_number, message: msg }));
    }

  }
}

module.exports = UpdateCache;
