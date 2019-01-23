'use strict';

const Subscription = require('egg').Subscription;
const axios = require('axios');


class UpdateCache extends Subscription {
  // 通过 schedule 属性来设置定时任务的执行间隔等配置
  static get schedule() {
    return {
      // disable: true,
      interval: '30s', // 1 分钟间隔
      immediate: true,
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
      // console.log('====', tmp.senderName);
      if (tmp.senderName !== this.app.config.target_name) continue;
      if (this.app.config.config_db.last_room_content_ids.has(iterator.msgidClient)) continue;
      // ids.add(iterator.msgidClient);
      const tmp_array = [ ...(this.app.config.config_db.last_room_content_ids) ];
      tmp_array.splice(0, 0, iterator.msgidClient);
      if (tmp_array.length > 20) { tmp_array.splice(-1, 1); }

      this.app.config.config_db.last_room_content_ids = new Set(tmp_array);
      await this.app.syncDb();

      const msg = await this.dealRoomContent(iterator);

      // console.log('msg====', msg);
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

    switch (iterator.extInfo.messageObject) {
      case 'text':
        type = '发言';
        content = `【${iterator.extInfo.text}】`;
        break;
      case 'messageBoard':
        type = '发言';
        content = `【${iterator.extInfo.text}】`;
        break;
      case 'faipaiText':
        {
          const userName = await this.getUsernameFromjuju(iterator.extInfo.faipaiUserId);
          type = `回复【${userName}】的留言【${iterator.extInfo.faipaiContent}】`; // "faipaiUserId":666073
        }

        content = `【${iterator.extInfo.messageText}】`;
        break;
      case 'idolFlip':
        type = `${iterator.extInfo.idolFlipTitle}`;
        content = `【${iterator.extInfo.idolFlipContent}】`;
        break;
      case 'image':
        type = '图片';
        // content = '[' + JSON.parse(iterator.bodys).url + '][qq 浏览器白名单会拦截]';
        content = '请打开 packet48 查看';
        break;
      default:
        return false;
    }

    const msg =
            "平台: '口袋48' \n" +
            `发送人: ${iterator.extInfo.senderName} \n` +
            `时间: ${iterator.msgTimeStr} \n` +
            `类型: ${type} \n` +
            '内容:\n' +
            `${content} \n`;
    return msg;
  }
}

module.exports = UpdateCache;
