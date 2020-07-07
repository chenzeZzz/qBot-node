'use strict';

const Subscription = require('egg').Subscription;
const moment = require('moment');

class TaobaPK extends Subscription {
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
    const taobaId = this.config.taoba.taobaPKId;
    console.log(`刷新${this.app.config.target_name}的桃叭PK信息`);
    if (!taobaId) {
      return;
    }

    const orderList = await this.service.http.getRankInfoFromTaoba(taobaId);
    if (!orderList || !orderList.length) return;
    // 取最新的一条，判断是否为新增.
    let skip = true;
    try {
      skip =
        (Number(orderList[0].stime) + 60 * 60 * 24) * 1000 <
        new Date().getTime();
    } catch (error) {
      skip = false;
      this.errLog('桃叭 list 判断失败======' + error);
    }
    if (skip) return; // 没新增

    const lastRecordInDb = (await ctx.service.taoba.getLastTaobaRecordByTaobaId(
      taobaId
    )) || { stime: 0 };
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
    const lastStimeInDb = Number(new Date(lastRecordInDb.stime).getTime());
    orderList.forEach(item => {
      if (lastStimeInDb < Number(item.stime) * 1000) {
        records.push({
          taobaId,
          listId: item.id,
          money: item.money,
          uid: item.userid,
          nick: item.nick,
          stime: item.stime * 1000,
        });
      }
    });

    if (!records.length) return;

    // save db
    await ctx.service.taoba.savaTaoba(records);

    //   [
    //     {
    //         "id": 4179,
    //         "sid": 839,
    //         "ads": "https://s0.tao-ba.club/upfile/idols/202006/aUFo60fX.png",
    //         "title": "【王晓佳篇】穿过水晶的光芒",
    //         "expire": 1591545540,
    //         "donation": 14471,
    //         "site": {
    //             "nickname": "SNH48-王晓佳应援会",
    //             "safedeposit": 0,
    //             "avatar": "https://www.taoba.club/img/grab?s=RURSN2B9+Hgyq3iL0d8JrFRNX3ALVQTDEpRa/3UD4AEZP2EhdPXEPt3pOWagKIpnHbq5v4BUSchs68+csLMkdf9g0lwxHnuT&_=.jpg"
    //         }
    //     },
    //     {
    //         "id": 4178,
    //         "sid": 634,
    //         "ads": "https://s0.tao-ba.club/upfile/idols/202006/jkpQ1pMQ.png",
    //         "title": "【冉蔚总选1.0】穿过水晶的光芒",
    //         "expire": 1591545540,
    //         "donation": 14172,
    //         "site": {
    //             "nickname": "SNH48-冉蔚应援会",
    //             "safedeposit": 0,
    //             "avatar": "https://www.taoba.club/img/grab?s=lKZiDMuKqFhmPMGSRxnv7ChnRU+WggfVqrLadcIUpTlXUjBraKBasCvmor8vva/5k1qt3tMiXwbo0cYnEMqzDUlebRQDbehd&_=.jpg"
    //         }
    //     }
    // ]
    const pkstats = await this.app.getPkstatsFromTaoba();
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
      const msg =
        `感谢 ${iterator.nick} 刚刚在${masterItem.title}中支持了：${iterator.money}元！ \n` +
        `已筹: ${masterItem.donation} 元\n` +
        `排名: ${rankIndex + 1} 名\n` +
        `${rankInfo}` +
        `集资截止时间: ${moment(masterItem.expire * 1000).format(
          'YYYY-MM-DD'
        )} \n` +
        `集资链接: ${this.app.config.target_site_origin + this.app.config.taoba.taobaPKId} \n` +
        '输入 `集资` 或者 `jz` 查看详情';
      this.app.socket_qbot.send(
        this.app.config.genMsg('send_group_msg', {
          group_id: this.app.config.group_id,
          message: msg,
        })
      );
    });

  }
}

module.exports = TaobaPK;
