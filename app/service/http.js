'use strict';

const axios = require('axios');
const Service = require('egg').Service;
const crypto = require('crypto');

const utils = require('../lib/utils');

const FASALT = 'K4bMWJawAtnyyTNOa70S';

const sleep = timeountMS =>
  new Promise(resolve => {
    setTimeout(resolve, timeountMS);
  });

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
        appInfo:
          '{"vendor":"apple","deviceId":"2F82F4FF-4CDA-4A30-8217-1C39E64E57C2","appVersion":"6.0.13","appBuild":"200513","osVersion":"13.4.1","osType":"ios","deviceName":"unknow","os":"ios"}',
      },
      data: JSON.stringify({
        pwd: config.password,
        mobile: config.account,
      }),
    });
    if (result.data.status === 200) {
      this.app.socket_qbot.send(
        config.genMsg('send_group_msg', {
          group_id: config.group_id_test,
          message: `获取 48 token: ${result.data.content.token}`,
        })
      );
      return result.data.content;
    }
    this.app.socket_qbot.send(
      config.genMsg('send_group_msg', {
        group_id: config.group_id_test,
        message: '获取 48 token 失败:' + JSON.stringify(result.data),
      })
    );
  }

  async getToken() {
    const { config } = this.app;
    return config.config_db.token
      ? config.config_db.token
      : (await this.login_48()).token;
  }

  getPA() {
    const timestamp = parseInt(new Date().getTime() / 1000) + '000';
    const randomNum = Math.floor(Math.random() * 9999);
    const mixData = crypto
      .createHash('md5')
      .update(timestamp + randomNum + FASALT)
      .digest('hex')
      .toUpperCase();

    // MTU5MTIwODM1NjAwMCw3NzI3LGVkNzRiMjJlMTA0YTAwMWRjZmRmOWNlYTZlNTM4YWUw
    // 1591208376000,324,B4172C84B44E1C7651EE1A5320227892
    const pa = Buffer.from([ timestamp, randomNum, mixData ].join(',')).toString(
      'base64'
    );
    return pa;
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
        'User-Agent':
          'PocketFans201807/6.0.13 (iPhone; iOS 13.4.1; Scale/2.00)',
        pa: this.getPA(),
        appInfo:
          '{"vendor":"apple","deviceId":"2F82F4FF-4CDA-4A30-8217-1C39E64E57C2","appVersion":"6.0.13","appBuild":"200513","osVersion":"13.4.1","osType":"ios","deviceName":"unknow","os":"ios"}',
      },
      data: JSON.stringify({
        needTop1Msg: false,
        roomId,
        ownerId,
        nextTime: 0,
      }),
    });
    if (result.data.status !== 200 && result.data.message) {
      this.app.socket_qbot.send(
        config.genMsg('send_group_msg', {
          group_id: config.group_id_test,
          message: `${config.account} 48 账号过期`,
        })
      );
      const newToken = (await this.login_48()).token;
      if (!newToken) return [];
      config.config_db.token = newToken;
      await this.app.syncDb();
      await sleep(5000);
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

  /**
   * Get rank info from Taoba
   * @param {string} taobaId 订单号
   */
  async getRankInfoFromTaoba(taobaId) {
    const params = {
      id: taobaId,
      limit: 1,
      requestTime: new Date().getTime(),
      pf: 'h5',
    };
    const result = await axios({
      method: 'POST',
      url: this.app.config.taoba.rankUrl,
      headers: this.app.config.taoba.headers,
      data: JSON.stringify(params),
    });
    const data = await utils.decodeData(result.data);

    if (data.code === 0) {
      return data.list;
    }
  }

  /**
   * Get rank info from Taoba
   */
  async getPkstatsFromTaoba() {
    const params = {
      pkgroup: this.app.config.taoba.pkgroup,
      requestTime: new Date().getTime(),
      _version_: 1,
      pf: 'h5',
    };
    const result = await axios({
      method: 'POST',
      url: this.app.config.taoba.pkUrl,
      headers: this.app.config.taoba.headers,
      data: JSON.stringify(params),
    });
    const data = await utils.decodeData(result.data);
    if (data.code === 0) {
      return data.list;
    }
  }
}

module.exports = HttpService;
