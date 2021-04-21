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
    config.pocketToken.imei = config.pocketToken.imei || utils.genImei();
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
    const { config, ctx } = this;
    const { token } = await ctx.model.Token.findOneById();
    config.pocketToken.token = token;
    return token;
    // return config.pocketToken.token
    //   ? config.pocketToken.token
    //   : (await this.login_48()).token;
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
    console.log('sxixxixixi===', result.data);
    if (result.data.status !== 200) {
      this.app.socket_qbot.send(
        config.genMsg('send_group_msg', {
          group_id: config.group_id_test,
          message: `${config.account} 48 账号过期`,
        })
      );
      const newToken = (await this.login_48()).token;
      if (!newToken) return [];
      config.pocketToken.token = newToken;

      // token 写到 db
      await this.ctx.model.Token.UpdateToken(newToken);

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
      url: this.config.api_48_v2.question_answer,
      headers: this.config.headers(this.config.pocketToken.imei, token),
      data: { answerId, questionId },
    });
    if (result && result.data.content) {
      return result.data.content.userName;
    }
    return answerId;
  }


}

module.exports = HttpService;
