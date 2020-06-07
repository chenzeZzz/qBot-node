"use strict";

const Service = require("egg").Service;

class TaobaService extends Service {
  async getTaobaDetail(roomId, ownerId, name, isOtherRoom) {
    const { config } = this.ctx.app;
    console.log(`刷新${name}的桃叭排行`);
    const roomMain = await this.service.http.getRankInfoFromTaoba(
      roomId,
      ownerId
    );
    roomMain.reverse();
    for (const iterator of roomMain) {
      const tmp = JSON.parse(iterator.extInfo);
      // 这个地方类型有的 string 有的number
      if (tmp.user.userId !== config.ownerId) continue;
      // 数据库查找, 如果存在就跳过
      const isExist = await this.ctx.service.message.isMessageExist(
        iterator.msgidClient
      );
      if (isExist) continue;
      // 解析新消息
      const msg = await this.dealRoomContent(iterator, name, isOtherRoom);
      if (!msg) continue;
      this.app.socket_qbot.send(
        config.genMsg("send_group_msg", {
          group_id: config.group_id,
          message: msg,
        })
      );
      // this.app.socket_qbot.send(config.genMsg('send_private_msg', { user_id: config.qq_number, message: msg }));
    }
  }
}

module.exports = TaobaService;
