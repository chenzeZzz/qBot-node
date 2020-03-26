'use strict';

const socket = require('../lib/socket_instance');
const axios = require('axios');
const jsonfile = require('jsonfile');
const md5 = require('blueimp-md5');
const request = require('request');

// 扩展一些框架便利的方法
module.exports = {
  getSocket() {
    return socket.getInstance(this.config.wsIp);
  },

  errLog(msg) {
    console.error(msg);
    this.socket_qbot.send(this.config.genMsg('send_group_msg', { group_id: this.config.group_id_test, message: msg }));
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

  // 同步db 内容到缓存
  async initDbConfig(file) {
    jsonfile.readFile(file)
      .then(obj => {
        this.config.config_db = Object.assign(this.config.config_db, obj);
      })
      .catch(error => console.error('init db config err======', error));
  },

  // 写入 db目录持久化
  async syncDb(file) {
    if (!file) file = __dirname + '/../../db/config.json';
    const obj = this.config.config_db;
    await jsonfile.writeFileSync(file, obj, { spaces: 2 });
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
          const event_data = JSON.parse(e.data);

          if (event_data && event_data.message_type && event_data.message_type === 'group' &&
          event_data.group_id && event_data.group_id === config.group_id &&
          event_data.message) {
            switch (event_data.message) {
              case '集资':
                try {
                  if (!that.config.modian_id) {
                    client.send(config.genMsg('send_group_msg', { group_id: config.group_id, message: '目前没有集资活动!' }));
                    break;
                  }
                  const form = {
                    pro_id: that.config.modian_id,
                  };
                  let data = await that.getModianDetail(form, that.config.modian_detail_url);
                  data = data[0];
                  const msg =
                  `${data.pro_name} \n` +
                  `完成金额: ${data.already_raised} \n` +
                  `目标金额: ${data.goal} \n` +
                  `支持人数: ${data.backer_count} \n` +
                  `截止时间: ${data.end_time} \n` +
                  `${data.left_time} \n` +
                  '\n' +
                  '生日集资链接:\n' +
                  `${that.config.target_site_origin}` +
                  '\n';

                  client.send(config.genMsg('send_group_msg', { group_id: config.group_id, message: msg }));
                } catch (error) {
                  that.errLog('获取集资信息失败======' + error);
                  return;
                }
                break;
              case '微博':
                try {
                  const result = await that.isWeiboUpdate();
                  console.log('result===', result);
                  if (result) {
                    let weiboUrl = '';
                    try {
                      result.last_weibo_id.substr(2);
                      weiboUrl = `https://m.weibo.cn/status/${result.last_weibo_id.substr(2)}`;
                    } catch (error) {
                      weiboUrl = '请打开微博查看';
                    }
                    const target_name = that.config.target_name;
                    const msg = [
                      {
                        type: 'text',
                        data: { text: `你们的小可爱${target_name}最新的微博\n` },
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
                    that.socket_qbot.send(that.config.genMsg('send_group_msg', { group_id: that.config.group_id, message: msg }));
                  } else {
                    that.errLog('获取微博信息失败======, 没有 result');
                  }
                } catch (error) {
                  that.errLog('获取微博信息失败======' + error);
                  return;
                }
                break;

              default:
                break;
            }

          }

          if (event_data && event_data.notice_type && event_data.notice_type === 'group_increase' && event_data.group_id && event_data.group_id === config.group_id) {
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
              // `生日集资连接：${config.target_site_origin} \n`+
              // '输入 `微博` 查看最新微博详情' +
              '\n';

            client.send(config.genMsg('send_group_msg', { group_id: config.group_id, message: msg }));
          }
        }
      };
    } catch (error) {
      this.errLog('长链接获取事件失败======' + error);
      process.exit(0);
    }
  },

  getModianDetail(form, url) {
    return new Promise(res => {
      form.sign = this.signModianForm(form);

      request.post({
        url,
        form,
        headers: this.config.modian_headers,
      }, (err, response, body) => {
        if (err) {
          console.log('err in task modian===', err);
          return;
        }
        body = JSON.parse(body);
        if (body.status === '0') {
          return res(body.data);
        }
        return null;
      });
    });
  },

  signModianForm(form) {
    // 将键名取出按照升序排列，拼接成query string。 需要encode
    form = Reflect.ownKeys(form).sort((a, b) => {
      if (a < b) {
        return -1;
      } else if (a > b) {
        return 1;
      }

      return 0;
    }).map(key => `${key}=${encodeURIComponent(form[key])}`)
      .join('&');

    // 将qs 加上&p=das41aq6计算md5(16), 从第6位开始取16位
    return md5(form.concat('&p=das41aq6')).substr(5, 16);
  },


};
