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

  errLog(msg) {
    this.socket_qbot.send(this.config.config_48.genMsg('send_group_msg', { group_id: this.config.group_id_test, message: msg }));
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
    try {
      const result = await weiboSpider.getRemoteLastWeibo();
      const is_new = this.config.config_48.last_weibo_content_id.indexOf(result.last_weibo_id) === -1;

      if (is_new) {
        this.config.config_48.last_weibo_content_id.push(result.last_weibo_id);
        await this.syncDb();
      }
      result.is_new = is_new;
      return result;
    } catch (error) {

      const client = this.getSocket();
      const config = this.config;
      client.send(config.config_48.genMsg('send_group_msg', { group_id: config.group_id_test, message: {
        error,
        msg: '微博 cookie 需要更换?',
      } }));

    }

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

  async getUserInfo(user_id) {
    const user_info = await axios({
      method: 'GET',
      // url: 'http://localhost:5700/get_stranger_info',
      url: `http://localhost:5700/get_stranger_info?user_id=${user_id}&no_cahce=false`,
    });

    return user_info;
  },

  async getEvent() {
    const client = this.getSocket();
    const config = this.config;
    const that = this;
    try {
      client.onmessage = async function(e) {
        if (typeof e.data === 'string') {
          // console.log("Received from coolq: '" + e.data + "'");
          const event_data = JSON.parse(e.data);

          if (event_data && event_data.notice_type && event_data.notice_type === 'group_increase' && event_data.group_id && event_data.group_id === config.group_id) {
            console.log('=====event_data=====', event_data);

            // 欢迎加入SNH48-吕一应援群~

            // 微博：@SNH48-吕一 ：http://weibo.com/u/6021143413
            // B站：臭脚番茄 ：http://space.bilibili.com/11399736
            // 找应援会：
            // 微博：http://weibo.com/u/5742612817
            // B站 : https://space.bilibili.com/57253753
            // 十一月日常应援现火热进行中：https://m.modian.com/project/37894.html?nostatic=1&_wv=1031

            // const user_info = await that.getUserInfo(event_data.user_id);
            // const _user_info = user_info.data.data;
            // if (!_user_info || !_user_info.nickname) return;

            const msg =
              `欢迎 [CQ:at,qq=${event_data.user_id}] 加入SNH48-吕一应援群~ \n` +
              '找吕一： \n' +
              '微博：@SNH48-吕一 ：http://weibo.com/u/6021143413 \n' +
              'B站：臭脚番茄 ：http://space.bilibili.com/11399736 \n' +
              '找应援会： \n' +
              '微博：http://weibo.com/u/5742612817 \n' +
              'B站 : https://space.bilibili.com/57253753 \n' +
              '十二月日常应援现火热进行中：http://mourl.cc/CBamdccm \n';

            client.send(config.config_48.genMsg('send_group_msg', { group_id: config.group_id, message: msg }));
          }
        }
      };
    } catch (error) {
      this.errLog('长链接获取事件失败======' + error);
      process.exit(0);
    }
  },


};
