'use strict';

const Service = require('egg').Service;

const weiboSpider = require('../lib/weiboSpider').getWeiboSpiderInstance();


class WeiboService extends Service {

  async isWeiboExist(weiboId) {
    const { ctx } = this;

    const data = await ctx.model.Weibo.findOneByWeiboId(weiboId);
    if (data) {
      return true;
    }
  }

  async isWeiboUpdate() {
    const { config, socket_qbot } = this.ctx.app;
    try {
      const result = await weiboSpider.getRemoteLastWeibo(config.weiboId);
      if (!result || !result.last_weibo_id) return;
      // 检查收否已经存 db
      const isNewWeibo = await this.isWeiboExist(result.last_weibo_id);
      console.log('isNewWeibo=====', isNewWeibo);
      if (!isNewWeibo) {
        // 未存 db 再广播一次
        await this.ctx.model.Weibo.register({
          weiboId: result.last_weibo_id,
          content: result.content,
        });
        let weiboUrl = '';
        try {
          result.last_weibo_id.substr(2);
          weiboUrl = `https://m.weibo.cn/status/${result.last_weibo_id.substr(2)}`;
        } catch (error) {
          weiboUrl = '请打开微博查看';
        }
        const msg = [
          {
            type: 'text',
            data: { text: `你们的小可爱${config.target_name}发微博啦\n` },
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
            data: { text: `微博链接:\n【${weiboUrl}】` },
          },
        ];
        socket_qbot.send(config.genMsg('send_group_msg', { group_id: config.group_id, message: msg }));
      // socket_qbot.send(config.genMsg('send_private_msg', { user_id: config.qq_number, message: msg }));
      }
    } catch (error) {
      // console.log('error=====', error)
      const client = this.app.getSocket();
      const config = this.config;
      client.send(config.genMsg('send_group_msg', { group_id: config.group_id_test, message: '微博 cookie 需要更换?' }));
    }
  }

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
    const roomMain = await this.service.httpService.getRoomMain(roomId, ownerId);
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
        message.answerTo = await this.service.httpService.getAnswerDetail(iterator.extInfo.answerId, iterator.extInfo.questionId);
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

module.exports = WeiboService;
