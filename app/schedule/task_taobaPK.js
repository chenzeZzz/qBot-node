'use strict';

const Subscription = require('egg').Subscription;
const moment = require('moment');
const _ = require('lodash');

const taobaHttp = require('../lib/taobaHttp');

class TaobaPK extends Subscription {
  // 通过 schedule 属性来设置定时任务的执行间隔等配置
  static get schedule() {
    return {
      disable: process.env.NODE_ENV === 'development',
      interval: '10m', // 1 分钟间隔
      immediate: true,
      type: 'worker', // 指定所有的 worker 都需要执行
    };
  }

  async subscribe() {
    const ctx = this;
    const taobaId = this.config.taoba.taobaPKId;
    console.log(`刷新${this.config.target_name}的桃叭PK信息`);
    if (!taobaId) {
      return;
    }

    const orderList = await taobaHttp.getRankInfoFromTaoba(taobaId, this.config);
    if (!orderList || !orderList.length) return;

    const recordInDb = await ctx.service.taoba.getAll(taobaId);
    // { id: 53983,
    //   sn: '7ltlxf',
    //   money: '20.00',
    //   flower: 0,
    //   userid: 10447421,
    //   stime: 1591522843,
    //   nick: 'qyc_TT',
    //   avatar:
    //    'https://tvax3.sinaimg.cn/crop.0.14.751.751.1024/9cceebdfly8fi6u6z0dm3j20kv0lo0uz.jpg?KID=imgbed,tva&Expires=1587043178&ssig=CdI3pS0OMR'
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

    const pkstats = await taobaHttp.getPkstatsFromTaoba(taobaId, this.config);
    let rankIndex = -1;
    pkstats.forEach((item, index) => {
      if (String(item.id) === taobaId) {
        rankIndex = index;
      }
    });
    if (rankIndex < 0) {
      console.error('pkstats info is error');
      return;
    }

    const masterItem = pkstats[rankIndex];
    const targetItem = pkstats[rankIndex - 1];
    const rankInfo = targetItem ? `距离上一名${targetItem.site.nickname} 还有 ${(
      Number(targetItem.donation) - Number(masterItem.donation)
    ).toFixed(2)}\n` : '';

    records.forEach(iterator => {
      if (iterator.addMony > 0) {
        const msg =
          `感谢 ${iterator.nick} 刚刚在${masterItem.title}中支持了：${iterator.addMony.toFixed(2)}元！ \n` +
          `已筹: ${masterItem.donation} 元\n` +
          `排名: ${rankIndex + 1} 名\n` +
          `${rankInfo}` +
          `集资截止时间: ${moment(masterItem.expire * 1000).format(
            'YYYY-MM-DD'
          )} \n` +
          `集资链接: ${this.config.target_site_origin + this.config.taoba.taobaPKId} \n` +
          '输入 `集资` 或者 `jz` 查看详情';
        this.app.socket_qbot.send(
          this.config.genMsg('send_group_msg', {
            group_id: this.config.group_id,
            message: msg,
          })
        );
      }
    });

  }
}

module.exports = TaobaPK;
