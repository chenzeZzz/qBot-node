'use strict';

const Subscription = require('egg').Subscription;

class UpdateCache extends Subscription {
  // 通过 schedule 属性来设置定时任务的执行间隔等配置
  static get schedule() {
    return {
      // disable: true,
      interval: '5m', // 1 分钟间隔
      immediate: true,
      type: 'all', // 指定所有的 worker 都需要执行
    };
  }

  // subscribe 是真正定时任务执行时被运行的函数
  async subscribe() {

    const target_name = this.app.config.target_name;
    console.log(`刷新${target_name}的微博内容`);
    const result = await this.app.isWeiboUpdate();
    if (result && result.is_new) {
      const msg = [
        {
          type: 'text',
          data: { text: `你们的小可爱${target_name}发微博啦\n` },
        },
        {
          type: 'text',
          data: { text: result.content },
        },
        {
          type: 'text',
          data: { text: '\n' },
        },
        {
          type: 'text',
          data: { text: `微博链接:\n【https://m.weibo.cn/status/${result.last_weibo_id.substr(2)}】` },
        },
      ];
      this.app.socket_qbot.send(this.app.config.genMsg('send_group_msg', { group_id: this.app.config.group_id, message: msg }));
      // this.app.socket_qbot.send(this.app.config.genMsg('send_private_msg', { user_id: this.app.config.qq_number, message: msg }));
    }

  }
}

module.exports = UpdateCache;
