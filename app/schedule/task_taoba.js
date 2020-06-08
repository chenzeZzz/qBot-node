"use strict";

const Subscription = require("egg").Subscription;
const _ = require("lodash");
const moment = require("moment");

class Taoba extends Subscription {
  // 通过 schedule 属性来设置定时任务的执行间隔等配置
  static get schedule() {
    return {
      disable: false,
      interval: "1m", // 1 分钟间隔
      immediate: true,
      type: "worker", // 指定所有的 worker 都需要执行
    };
  }

  // subscribe 是真正定时任务执行时被运行的函数
  async subscribe() {
    const ctx = this;
    const taobaId = this.config.taoba.taobaId;

    console.log(`刷新${this.app.config.target_name}的桃叭信息`);
    if (!taobaId) {
      return;
    }

    const orderList = await this.service.http.getRankInfoFromTaoba();
    if (!orderList || !orderList.length) return;
    // 取最新的一条，判断是否为新增.
    let skip = true;
    try {
      skip =
        (Number(orderList[0].stime) + 60 * 60 * 24) * 1000 <
        new Date().getTime();
    } catch (error) {
      skip = false;
      this.errLog("桃叭 list 判断失败======" + error);
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
    orderList.filter((item) => {
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

    // get donation detail
    const donationDetail = await ctx.app.getJiZiDetail();
    records.forEach((iterator) => {
      const msg =
        `感谢 ${iterator.nick} 刚刚在${donationDetail.title}中支持了：${iterator.money}元！ \n` +
        `已筹: ${donationDetail.donation} 元\n` +
        `距离目标: ${donationDetail.amount} 还有 ${
          Number(donationDetail.amount) - Number(donationDetail.donation)
        }\n` +
        `集资截止时间: ${moment(donationDetail.expire * 1000).format(
          "YYYY-MM-DD"
        )} \n` +
        `集资链接: ${this.app.config.target_site_origin} \n` +
        "输入 `集资` 或者 `jz` 查看详情";
      this.app.socket_qbot.send(
        this.app.config.genMsg("send_group_msg", {
          group_id: this.app.config.group_id,
          message: msg,
        })
      );
    });
  }
}

module.exports = Taoba;
