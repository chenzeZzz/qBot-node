'use strict';

const Subscription = require('egg').Subscription;


class UpdateCache extends Subscription {
  // 通过 schedule 属性来设置定时任务的执行间隔等配置
  static get schedule() {
    return {
      disable: true,
      cron: '0 0 9,13,20 * * 2-7',
      immediate: false,
      type: 'worker',
    };
  }

  // subscribe 是真正定时任务执行时被运行的函数
  async subscribe() {
    console.log('考研倒计时!!!');
    const timedate = new Date('12,23,2020');
    const now = new Date();
    const date = timedate.getTime() - now.getTime(); // 得出的为毫秒
    const time = Math.ceil(date / (1000 * 60 * 60 * 24)); // 1000 * 60 * 60 * 24一天的秒数
    const month = date / (1000 * 60 * 60 * 24) / 30; // 1000 * 60 * 60 * 24一天的秒数
    if (time > 0) {
      let msg = [
        '亲爱的李雅静',
        '陈泽给你播报考研倒计时',
        `还有${time}天`,
        `大约${month.toFixed(1)}个月`,
        '陈泽给你加油呐喊:',
        '考研考的是坚持, 因为每天都有人在放弃',
        '为了在明年做想做的事',
        '坚持住, 加油, 你最棒!',
      ];
      msg = msg.join('\n');
      this.app.socket_qbot.send(this.app.config.genMsg('send_private_msg', { user_id: this.app.config.lyj_number, message: msg }));
    }


  }
}

module.exports = UpdateCache;
