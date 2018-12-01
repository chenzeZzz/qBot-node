'use strict';

const Subscription = require('egg').Subscription;
const utils = require('../lib/utils');


class UpdateCache extends Subscription {
  // 通过 schedule 属性来设置定时任务的执行间隔等配置
  static get schedule() {
    return {
      // disable: true,
      interval: '5m', // 1 分钟间隔
      immediate: false,
      type: 'all', // 指定所有的 worker 都需要执行
    };
  }

  // subscribe 是真正定时任务执行时被运行的函数
  async subscribe() {

    console.log(`刷新${this.app.config.config_48.target_name}的微博内容`);
    const is_new = await this.app.isWeiboUpdate();
    if (!is_new) return;

    const msg = [
      {
        type: 'text',
        data: { text: `是否为最新微博: ${is_new}\n` },
      },
      {
        type: 'face',
        data: { id: '111' },
      },
      {
        type: 'face',
        data: { id: '123' },
      },
      {
        type: 'text',
        data: { text: '\n' },
      },
      {
        type: 'text',
        data: { text: `微博链接:\n【https://weibo.com/u/${this.app.config.config_48.weiboId}?is_hot=1】` },
      },
    ];
    this.app.socket_qbot.send(this.app.config.config_48.genMsg('send_group_msg', { group_id: this.app.config.group_id, message: msg }));
    // this.app.socket_qbot.send(this.app.config.config_48.genMsg('send_private_msg', { user_id: this.app.config.qq_number, message: msg }));
  }
}

module.exports = UpdateCache;
