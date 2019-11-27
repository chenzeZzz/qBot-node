'use strict';

const axios = require('axios');
const Service = require('egg').Service;

class HttpService extends Service {

  async login_48() {
    console.log('denglu one ========');
    const { config } = this.app;
    config.config_db.imei = config.config_db.imei || this.genImei();
    const result = await axios({
      method: 'POST',
      url: config.api_48_v2.login,
      headers: {
        'Content-Type': 'application/json;charset=utf-8',
        appInfo: '{"vendor":"apple","deviceId":"2F82F4FF-4CDA-4A30-8217-1C39E64E57C2","appVersion":"6.0.0","appBuild":"190409","osVersion":"9.3.2","osType":"ios","deviceName":"iPhone SE","os":"ios"}',
      },
      data: JSON.stringify({
        pwd: config.password,
        mobile: config.account,
      }),
    });
    if (result.data.status === 200) {
      this.app.socket_qbot.send(config.genMsg('send_group_msg', { group_id: config.group_id_test, message: `获取 48 token: ${result.data.content.token}` }));
      return result.data.content;
    }
    this.app.socket_qbot.send(config.genMsg('send_group_msg', { group_id: config.group_id_test, message: '获取 48 token 失败:' + JSON.stringify(result.data) }));
  }

  async getToken() {
    const { config } = this.app;
    return config.config_db.token ? config.config_db.token : (await this.login_48()).token;
  }

  async getRoomMain(roomId, ownerId) {
    const { config } = this.app;
    const token = await this.getToken();
    const result = await axios({
      method: 'POST',
      url: this.config.api_48_v2.roomMain,
      timeout: 5000,
      headers: {
        token,
        'Content-Type': 'application/json;charset=utf-8',
      },
      data: JSON.stringify({
        needTop1Msg: false,
        roomId,
        ownerId,
        nextTime: 0,
      }),
    });
    if (result.data.status !== 200 && result.data.message && (result.data.message.indexOf('登陆') > -1 || result.data.message.indexOf('过期') > -1)) {
      this.app.socket_qbot.send(config.genMsg('send_group_msg', { group_id: config.group_id_test, message: '48 账号过期' }));
      const newToken = (await this.login_48()).token;
      if (!newToken) return [];
      config.config_db.token = newToken;
      await this.app.syncDb();
      return await this.getRoomMain(roomId, ownerId);
    }
    return result.data.content.message;
  }

  async getAnswerDetail(answerId, questionId) {
    const token = await this.getToken();
    const result = await axios({
      method: 'POST',
      url: this.app.config.api_48_v2.question_answer,
      headers: this.config.headers(this.app.config.config_db.imei, token),
      data: { answerId, questionId },
    });
    if (result && result.data.content) {
      return result.data.content.userName;
    }
    return answerId;
  }
}

module.exports = HttpService;
