'use strict';

const Subscription = require('egg').Subscription;
const axios = require('axios');


class UpdateCache extends Subscription {
  // 通过 schedule 属性来设置定时任务的执行间隔等配置
  static get schedule() {
    return {
      disable: false,
      interval: '1m', // 1 分钟间隔
      immediate: false,
      type: 'all', // 指定所有的 worker 都需要执行
    };
  }

  // subscribe 是真正定时任务执行时被运行的函数
  async subscribe() {
    console.log(`刷新${this.app.config.target_name}的房间内容`);
    const roomMain = await this.app.getRoomMain();
    roomMain.reverse();
    // console.log('xoxoxoxooxox', roomMain);
    for (const iterator of roomMain) {
      const tmp = JSON.parse(iterator.extInfo);
      // 这个地方类型有的 string 有的number
      // console.log('====', tmp.senderId);
      // console.log('====', typeof tmp.senderId);
      if (tmp.user.userId != this.app.config.packetId) continue;
      if (this.app.config.config_db.last_room_content_ids.has(iterator.msgidClient)) continue;
      // ids.add(iterator.msgidClient);
      const tmp_array = [ ...(this.app.config.config_db.last_room_content_ids) ];
      tmp_array.splice(0, 0, iterator.msgidClient);
      if (tmp_array.length > 200) { tmp_array.splice(-1, 1); }

      this.app.config.config_db.last_room_content_ids = new Set(tmp_array);
      await this.app.syncDb();

      const msg = await this.dealRoomContent(iterator);

      console.log('msg====', msg);
      if (!msg) continue;
      this.app.socket_qbot.send(this.app.config.genMsg('send_group_msg', { group_id: this.app.config.group_id, message: msg }));
      // this.app.socket_qbot.send(this.app.config.genMsg('send_private_msg', { user_id: this.app.config.qq_number, message: msg }));
    }
  }

  async getUsernameFromjuju(faipaiUserId) {
    const token = await this.app.getToken();
    const result = await axios({
      method: 'POST',
      url: this.app.config.api_48.getUserInfo + faipaiUserId,
      headers: this.config.headers(this.app.config.config_db.imei, token),
      data: { needRecommend: true, needChatInfo: true, needFriendsNum: true },
    });
    if (result && result.data.content) {
      return result.data.content.userInfo.nickName;
    }
    return faipaiUserId;

  }

  async dealRoomContent(iterator) {
    iterator.extInfo = JSON.parse(iterator.extInfo);
    let type = '',
      content = '';

    switch (iterator.extInfo.messageType) {
      case 'TEXT':
        type = '发言';
        content = `【${iterator.extInfo.text}】`;
        break;
      case 'MESSAGEBOARD':
        type = '发言';
        content = `【${iterator.extInfo.text}】`;
        break;
      case 'REPLY':
        type = `回复【${iterator.extInfo.replyName}】的留言【${iterator.extInfo.replyText}】`; // "faipaiUserId":666073
        content = `【${iterator.extInfo.text}】`;
        break;
      case 'FLIPCARD':
        // type = `${iterator.extInfo.idolFlipTitle}`;
        // content = `【${iterator.extInfo.idolFlipContent}】`;
        type = '未知';
        content = '翻牌';
        break;
      case 'IMAGE':
        type = '图片';
        // content = '[' + JSON.parse(iterator.bodys).url + '][qq 浏览器白名单会拦截]';
        content = '请打开 packet48 查看';
        break;
      case 'LIVEPUSH':
        type = '直播信息';
        content = `${iterator.bodys}`; // 正在直播
        break;
      default:
        return false;
    }

    const msg =
            "平台: '口袋48' \n" +
            `发送人: ${iterator.extInfo.user.nickName} \n` +
            '时间: ' + new Date(iterator.msgTime).toLocaleString().replace(new RegExp('/', 'g'), '-') + '\n' +
            `类型: ${type} \n` +
            '内容:\n' +
            `${content} \n`;
    return msg;
  }
}

module.exports = UpdateCache;
