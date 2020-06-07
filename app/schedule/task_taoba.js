"use strict";

const Subscription = require("egg").Subscription;
const _ = require("lodash");

class Taoba extends Subscription {
  // 通过 schedule 属性来设置定时任务的执行间隔等配置
  static get schedule() {
    return {
      disable: true,
      interval: "1m", // 1 分钟间隔
      immediate: true,
      type: "worker", // 指定所有的 worker 都需要执行
    };
  }

  // subscribe 是真正定时任务执行时被运行的函数
  async subscribe() {
    const that = this;

    console.log(`刷新${this.app.config.target_name}的桃叭信息`);
    if (!that.config.modian_id) {
      return;
    }
    const form = {
      pro_id: this.app.config.modian_id,
      type: 1,
    };
    const order_list = await this.app.getModianDetail(
      form,
      this.app.config.modian_order_url
    );
    if (!order_list || order_list.length < 1) return;
    const modian_user_list = this.app.config.config_db.modian_user_list;
    for (const iterator of order_list) {
      if (
        _.find(modian_user_list, {
          user_id: iterator.user_id,
          pay_time: iterator.pay_time,
        })
      ) {
        continue;
      }
      modian_user_list.push(iterator);

      if (form.type) delete form.type;
      if (form.sign) delete form.sign;

      let donate_detail = await this.app.getModianDetail(
        form,
        this.app.config.modian_detail_url
      );
      donate_detail = donate_detail[0];

      const msg =
        `感谢 ${iterator.nickname} 刚刚在${donate_detail.pro_name}中支持了：${iterator.backer_money}元！ \n` +
        `已筹￥: ${donate_detail.already_raised} \n` +
        `距离目标￥: ${donate_detail.goal} 还有 ${
          Number(donate_detail.goal) - Number(donate_detail.already_raised)
        }\n` +
        `集资链接: ${this.app.config.target_site_origin}` +
        "输入 `集资` 查看详情";
      this.app.socket_qbot.send(
        this.app.config.genMsg("send_group_msg", {
          group_id: this.app.config.group_id,
          message: msg,
        })
      );
    }
  }
}

module.exports = Taoba;
