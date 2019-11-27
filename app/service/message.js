'use strict';

const Service = require('egg').Service;

class MessageService extends Service {

  async isMessageExist(messageId) {
    const { ctx } = this;

    const message = await ctx.model.Message.findOneByMsgId(messageId);
    if (message) {
      return true;
    }
  }

  async savaMessage(message) {
    const { ctx } = this;

    await ctx.model.Message.register(message);
  }

  // 查房间内容

  async spiderOneRoom(roomId, ownerId, name, isOtherRoom) {
    const { config } = this.ctx.app;
    console.log(`刷新${name}的房间内容`);
    const roomMain = await this.service.http.getRoomMain(roomId, ownerId);
    roomMain.reverse();
    for (const iterator of roomMain) {
      const tmp = JSON.parse(iterator.extInfo);
      // 这个地方类型有的 string 有的number
      if (tmp.user.userId !== config.ownerId) continue;
      // 数据库查找, 如果存在就跳过
      const isExist = await this.ctx.service.message.isMessageExist(iterator.msgidClient);
      if (isExist) continue;
      // 解析新消息
      const msg = await this.dealRoomContent(iterator, name, isOtherRoom);
      if (!msg) continue;
      this.app.socket_qbot.send(config.genMsg('send_group_msg', { group_id: config.group_id, message: msg }));
      // this.app.socket_qbot.send(config.genMsg('send_private_msg', { user_id: config.qq_number, message: msg }));
    }
  }

  async dealRoomContent(iterator, name) {
    iterator.extInfo = JSON.parse(iterator.extInfo);
    const message = {
      messageId: iterator.msgidClient,
      roomId: iterator.extInfo.roomId,
      createdAt: new Date(iterator.msgTime),

    };
    switch (iterator.extInfo.messageType) {
      case 'TEXT':
        message.type = '发言';
        message.content = `${iterator.extInfo.text}`;
        break;
      case 'MESSAGEBOARD':
        message.type = '发言';
        message.content = `${iterator.extInfo.text}`;
        break;
      case 'REPLY':
        message.type = '留言';
        message.answerTo = iterator.extInfo.replyName;
        message.question = iterator.extInfo.replyText;
        message.showType = `回复【${iterator.extInfo.replyName}】的留言【${iterator.extInfo.replyText}】`; // "faipaiUserId":666073
        message.content = `${iterator.extInfo.text}`;
        break;
      case 'FLIPCARD':
        // 获取详细内容
        message.type = '翻牌';
        message.answerTo = await this.ctx.service.http.getAnswerDetail(iterator.extInfo.answerId, iterator.extInfo.questionId);
        message.question = iterator.extInfo.question;
        message.showType = `回复【${message.answerTo}】的翻牌【${iterator.extInfo.question}】`; // "faipaiUserId":666073
        message.content = `${iterator.extInfo.answer}`;

        break;
      case 'IMAGE':
        message.type = '图片';
        // content = '[' + JSON.parse(iterator.bodys).url + '][qq 浏览器白名单会拦截]';
        message.content = JSON.parse(iterator.bodys).url;
        break;
      case 'LIVEPUSH':
        message.type = '直播信息';
        message.content = `${iterator.bodys}`; // 正在直播
        break;
      default:
        return false;
    }

    // 存入数据库
    await this.ctx.service.message.savaMessage(message);
    const msg =
            `房间: ${name} \n` +
            `发送人: ${iterator.extInfo.user.nickName} \n` +
            '时间: ' + new Date(iterator.msgTime).toLocaleString().replace(new RegExp('/', 'g'), '-') + '\n' +
            `类型: ${message.showType || message.type} \n` +
            '内容:\n' +
            `【${message.content}】\n`;
    return msg;
  }
}

module.exports = MessageService;
