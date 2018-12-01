'use strict';

const socket = require('../lib/socket_instance');
const axios = require('axios');
const weiboSpider = require('../lib/weiboSpider').getWeiboSpiderInstance();
const jsonfile = require('jsonfile');
const _ = require('lodash');


// 扩展一些框架便利的方法
module.exports = {
  getSocket() {
    return socket.getInstance();
  },

  initWs() {
    return new Promise(res => {
      const that = this;
      const client = this.getSocket();

      client.onerror = function() {
        console.log('Connection Error');
      };

      client.onopen = function() {
        console.log('WebSocket Client Connected， 获取 socket 实例', client.readyState);
        if (client.readyState === client.OPEN) {
          that.socket_qbot = client;
          res();
        }
      };

      client.onclose = function() {
        console.log('echo-protocol Client Closed');
      };

      client.onmessage = function(e) {
        if (typeof e.data === 'string') {
          console.log("Received: '" + e.data + "'");
        }
      };
    });
  },

  // 生成 48登录请求 hearder 种的 imei
  genImei() {
    const randomNum = function(minNum, maxNum) {
      switch (arguments.length) {
        case 1:
          return parseInt(Math.random() * minNum + 1, 10);
        case 2:
          return parseInt(Math.random() * (maxNum - minNum + 1) + minNum, 10);
        default:
          return 0;
      }
    };
    const r1 = 1000000 + randomNum(0, 8999999);
    const r2 = 1000000 + randomNum(0, 8999999);
    const input = r1 + '' + r2;
    let a = 0;
    let b = 0;
    for (let i = 0; i < input.length; i++) {
      const tt = parseInt(input.slice(i, i + 1));
      if (i % 2 === 0) {
        a = a + tt;
      } else {
        const temp = tt * 2;
        b = b + temp / 10 + temp % 10;
      }
    }
    let last = Math.round((a + b) % 10);
    if (last === 0) {
      last = 0;
    } else {
      last = 10 - last;
    }
    return input + '' + last;
  },

  async getToken() {
    return this.config.config_48.token ? this.config.config_48.token : (await this.login_48()).token;
  },

  async login_48() {
    console.log('denglu one ========');
    this.config.config_48.imei = this.config.config_48.imei || this.genImei();
    const result = await axios({
      method: 'POST',
      url: this.config.config_48.api.login,
      headers: this.config.config_48.headers(this.config.config_48.imei, this.config.config_48.token),
      data: JSON.stringify({
        account: this.config.config_48.account,
        password: this.config.config_48.password,
        longitude: 0,
        latitude: 0,
      }),
    });
    this.socket_qbot.send(this.config.config_48.genMsg('send_group_msg', { group_id: 947218914, message: `获取 48 token: ${result.data.content.token}` }));

    return result.data.content;
  },

  // method: 'POST',
  //           url: c.pocket48.api.roomMain,
  //           headers: new c.pocket48.headers(),
  //           data: JSON.stringify({
  //               "roomId": data.roomId,
  //               "chatType": 0,
  //               "lastTime": data.lastTime,
  //               "limit": data.limit,
  //           }),
  async getRoomMain() {
    const token = await this.getToken();
    this.config.config_48.imei = this.config.config_48.imei || this.genImei();

    const result = await axios({
      method: 'POST',
      url: this.config.config_48.api.roomMain,
      headers: this.config.config_48.headers(this.config.config_48.imei, token),
      data: JSON.stringify({
        roomId: this.config.config_48.roomId,
        chatType: 0,
        lastTime: Date.now(),
        limit: 10,
      }),
    });
    return result.data.content.data;
  },

  async isWeiboUpdate() {
    const result = await weiboSpider.getRemoteLastWeibo();
    // console.log('xixixixixixix', result);
    const is_new = result !== this.config.config_48.last_weibo_content_id;
    if (is_new) {
      this.config.config_48.last_weibo_content_id = result;
      await this.syncDb();
    }
    return is_new;
  },

  // 同步db 内容到缓存
  async initDbConfig(file) {
    jsonfile.readFile(file)
      .then(obj => {
        obj.last_room_content_ids = new Set(obj.last_room_content_ids);
        this.config.config_48 = Object.assign(this.config.config_48, obj);
      })
      .catch(error => console.error('init db config err======', error));
  },

  // 写入 db目录持久化
  async syncDb(file) {
    if (!file) file = __dirname + '/../../db/config.json';
    // const ids = this.config.config_48.last_room_content_ids;

    this.config.config_48.last_room_content_ids = Array.from(this.config.config_48.last_room_content_ids);
    // const obj = _.pick(this.config, 'config_48');
    const obj = this.config.config_48;

    // console.log('x0x0x0x0x0', obj);
    await jsonfile.writeFileSync(file, obj, { spaces: 2 });

    this.config.config_48.last_room_content_ids = new Set(this.config.config_48.last_room_content_ids);
  },


};
