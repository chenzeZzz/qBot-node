'use strict';

const Subscription = require('egg').Subscription;
const moment = require('moment');
const _ = require('lodash');

class Taoba extends Subscription {
  // 通过 schedule 属性来设置定时任务的执行间隔等配置
  static get schedule() {
    return {
      disable: false,
      interval: '1m', // 1 分钟间隔
      immediate: true,
      type: 'worker', // 指定所有的 worker 都需要执行
    };
  }

  // subscribe 是真正定时任务执行时被运行的函数
  async subscribe() {
    const ctx = this;
    const taobaId = this.config.taoba.taobaIdTmp || this.config.taoba.taobaId;

    console.log(`刷新${this.app.config.target_name}的桃叭信息`);
    if (!taobaId) {
      return;
    }

    const orderList = await this.service.http.getRankInfoFromTaoba(taobaId);
    console.log('orderList====', orderList.length);
    if (!orderList || !orderList.length) return;
    // 取最新的一条，判断是否为新增.

    const recordInDb = await ctx.service.taoba.getAll(taobaId);
    // {
    //   nick: '嗯_9237',
    //   sn: 20,
    //   flower: 0,
    //   stime: 1617262608,
    //   userid: 12011127,
    //   id: 20,
    //   avatar: 'https://thirdwx.qlogo.cn/mmopen/vi_32/Q0j4TwGTfTLjXqJeqKbicVk0OQW5cZichpZxcMaYxNQ6g49IZQJWvhPLsA897QicREMqnmLAarINIWHUJsmMZZjYQ/132',
    //   money: 1
    // }
    const records = [];
    orderList.forEach(item => {
      const pastRankItem = _.find(recordInDb, { uid: String(item.userid) });

      records.push({
        taobaId,
        listId: item.id,
        money: item.money,
        addMony: pastRankItem ? Number(item.money) - Number(pastRankItem.money) : Number(item.money), // 这次刷新新增
        uid: item.userid,
        nick: item.nick,
        stime: item.stime * 1000,
      });
    });
    if (!records.length) return;

    // delete current
    await ctx.service.taoba.deleteAllByTaobaoId(taobaId);

    // save db
    await ctx.service.taoba.savaTaoba(records);

    // get donation detail
    const donationDetail = await ctx.app.getJiZiDetail(taobaId, this.app.config);

    records.forEach(iterator => {
      if (iterator.addMony > 0) {
        const msg =
          `感谢 ${iterator.nick} 刚刚在${donationDetail.title}中支持了：${iterator.addMony.toFixed(2)}元！ \n` +
          `已筹: ${donationDetail.donation} 元\n` +
          `距离目标: ${donationDetail.amount} 还有 ${(
            Number(donationDetail.amount) - Number(donationDetail.donation)
          ).toFixed(2)}\n` +
          `集资截止时间: ${moment(donationDetail.expire * 1000).format(
            'YYYY-MM-DD'
          )} \n` +
          `集资链接: ${this.app.config.target_site_origin + taobaId} \n` +
          '输入 `集资` 或者 `jz` 查看详情';
        this.app.socket_qbot.send(
          this.app.config.genMsg('send_group_msg', {
            group_id: this.app.config.group_id,
            message: msg,
          })
        );
      }
    });
  }
}

module.exports = Taoba;
