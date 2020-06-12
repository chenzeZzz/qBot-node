'use strict';

const axios = require('axios');
const jsonfile = require('jsonfile');
const moment = require('moment');

const socket = require('../lib/socket_instance');
const utils = require('../lib/utils');

// 扩展一些框架便利的方法
module.exports = {
  getSocket() {
    return socket.getInstance(this.config.wsIp);
  },

  errLog(msg) {
    console.error(msg);
    this.socket_qbot.send(
      this.config.genMsg('send_group_msg', {
        group_id: this.config.group_id_test,
        message: msg,
      })
    );
  },

  initWs() {
    return new Promise(res => {
      const that = this;
      const client = this.getSocket();

      client.onerror = function() {
        console.log('Connection Error');
      };

      client.onopen = function() {
        console.log(
          'WebSocket Client Connected， 获取 socket 实例',
          client.readyState
        );
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
        b = b + temp / 10 + (temp % 10);
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
    jsonfile
      .readFile(file)
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

          if (
            event_data &&
            event_data.message_type &&
            event_data.message_type === 'group' &&
            event_data.group_id &&
            event_data.group_id === config.group_id &&
            event_data.message
          ) {
            switch (event_data.message) {
              case '集资':
              case 'jz':
                // await that.sendNormalInfo();

                await that.sendPKInfo(); // pk 集资信息
                break;
              case '微博':
                try {
                  const result = await that.isWeiboUpdate();
                  console.log('result===', result);
                  if (result) {
                    let weiboUrl = '';
                    try {
                      result.last_weibo_id.substr(2);
                      weiboUrl = `https://m.weibo.cn/status/${result.last_weibo_id.substr(
                        2
                      )}`;
                    } catch (error) {
                      weiboUrl = '请打开微博查看';
                    }
                    const target_name = that.config.target_name;
                    const msg = [
                      {
                        type: 'text',
                        data: {
                          text: `你们的小可爱${target_name}最新的微博\n`,
                        },
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
                    that.socket_qbot.send(
                      that.config.genMsg('send_group_msg', {
                        group_id: that.config.group_id,
                        message: msg,
                      })
                    );
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

          if (
            event_data &&
            event_data.notice_type &&
            event_data.notice_type === 'group_increase' &&
            event_data.group_id &&
            event_data.group_id === config.group_id
          ) {
            // 欢迎加入SNH48-吕一应援群~

            // 微博：@SNH48-吕一 ：http://weibo.com/u/6021143413
            // B站：臭脚番茄 ：http://space.bilibili.com/11399736
            // 找应援会：
            // 微博：http://weibo.com/u/5742612817
            // B站 : https://space.bilibili.com/57253753
            // 十一月日常应援现火热进行中：https://m.modian.com/project/37894.html?nostatic=1&_wv=1031
            const msg =
              `欢迎 [CQ:at,qq=${event_data.user_id}] 加入SNH48-吕一应援群~ \n` +
              '找吕一： \n' +
              '微博：@SNH48-吕一 ：http://weibo.com/u/6021143413 \n' +
              'B站：臭脚番茄 ：http://space.bilibili.com/11399736 \n' +
              '找应援会： \n' +
              '微博：http://weibo.com/u/5742612817 \n' +
              'B站 : https://space.bilibili.com/57253753 \n' +
              `生日集资连接：${config.target_site_origin} \n` +
              // '输入 `微博` 查看最新微博详情' +
              '\n';

            client.send(
              config.genMsg('send_group_msg', {
                group_id: config.group_id,
                message: msg,
              })
            );
          }
        }
      };
    } catch (error) {
      this.errLog('长链接获取事件失败======' + error);
      process.exit(0);
    }
  },

  /**
   * Get rank info from Taoba
   * @param {Object} config ''
   */
  async getPkstatsFromTaoba(config) {
    const params = {
      pkgroup: config.taoba.pkgroup,
      requestTime: new Date().getTime(),
      _version_: 1,
      pf: 'h5',
    };
    const result = await axios({
      method: 'POST',
      url: config.taoba.pkUrl,
      headers: config.taoba.headers,
      data: JSON.stringify(params),
    });
    const data = await utils.decodeData(result.data);
    if (data.code === 0) {
      return data.list;
    }
  },

  // 发送 pk 集资信息
  async sendPKInfo() {
    const client = this.getSocket();
    const config = this.config;
    const taobaId = config.taoba.taobaPKId;

    try {
      if (!taobaId) {
        client.send(
          config.genMsg('send_group_msg', {
            group_id: config.group_id,
            message: '目前没有集资活动!',
          })
        );
        return false;
      }


      const pkstats = await this.getPkstatsFromTaoba(config);
      let rankIndex = -1;
      pkstats.forEach((item, index) => {
        if (String(item.id) === taobaId) {
          rankIndex = index;
        }
      });
      if (rankIndex < 0) {
        console.error('pkstats info is error');
        return;
      }

      const masterItem = pkstats[rankIndex];
      const targetItem = pkstats[rankIndex - 1];
      const rankInfo = targetItem ? `距离上一名${targetItem.site.nickname} 还有 ${(
        Number(targetItem.donation) - Number(masterItem.donation)
      ).toFixed(2)}\n` : '';

      const data = await this.getJiZiDetail();
      const msg =
        `${data.title} \n` +
        ' \n' +
        `已筹: ${masterItem.donation} 元\n` +
        `排名: ${rankIndex + 1} 名\n` +
        `${rankInfo}` +
        `集资截止时间: ${moment(masterItem.expire * 1000).format(
          'YYYY-MM-DD'
        )} \n` +
        `集资链接: ${this.config.target_site_origin} \n` +
        '输入 `集资` 或者 `jz` 查看详情';
      client.send(
        config.genMsg('send_group_msg', {
          group_id: config.group_id,
          message: msg,
        })
      );
    } catch (error) {
      console.log('获取集资信息失败======' + error);

      config.genMsg('send_group_msg', {
        group_id: config.group_id,
        message: '集资信息稍后再试!',
      });
      this.errLog('获取集资信息失败======' + error);
      return;
    }
  },

  // 发送普通集资信息
  async sendNormalInfo() {
    const client = this.getSocket();
    const config = this.config;
    try {
      if (!config.taoba.taobaId) {
        client.send(
          config.genMsg('send_group_msg', {
            group_id: config.group_id,
            message: '目前没有集资活动!',
          })
        );
        return false;
      }
      const data = await this.getJiZiDetail();
      const msg =
        `${data.title} \n` +
        ' \n' +
        `完成金额: ${data.donation} \n` +
        `目标金额: ${data.amount} \n` +
        `支持进度: ${Number(data.percent).toFixed(2)}% \n` +
        `截止时间: ${moment(data.expire * 1000).format(
          'YYYY-MM-DD'
        )} \n` +
        `集资链接: ${config.target_site_origin} \n` +
        '输入 `集资` 或者 `jz` 查看详情';
      client.send(
        config.genMsg('send_group_msg', {
          group_id: config.group_id,
          message: msg,
        })
      );
    } catch (error) {
      console.log('获取集资信息失败======' + error);

      config.genMsg('send_group_msg', {
        group_id: config.group_id,
        message: '集资信息稍后再试!',
      });
      this.errLog('获取集资信息失败======' + error);
      return;
    }
  },


  async getJiZiDetail() {
    // return new Promise((res, rej) => {
    //   form.sign = this.signModianForm(form);
    //   request.post(
    //     {
    //       url,
    //       form,
    //       headers: this.config.modian_headers,
    //     },
    //     (err, response, body) => {
    //       if (err) {
    //         console.log("err in task modian===", err);
    //         return;
    //       }
    //       body = JSON.parse(body);
    //       if (body.status === "0") {
    //         return res(body.data);
    //       }
    //       return rej("Modian response disable !");
    //     }
    //   );
    // });

    const params = {
      id: this.config.taoba.taobaPKId,
      requestTime: new Date().getTime(),
      pf: 'h5',
    };
    const result = await axios({
      method: 'POST',
      url: this.config.taoba.url,
      headers: this.config.taoba.headers,
      data: JSON.stringify(params),
    });

    const data = await utils.decodeData(result.data);
    if (data.code === 0) {
      return data.datas;
    }
  },

  // signModianForm(form) {
  //   // 将键名取出按照升序排列，拼接成query string。 需要encode
  //   form = Reflect.ownKeys(form)
  //     .sort((a, b) => {
  //       if (a < b) {
  //         return -1;
  //       } else if (a > b) {
  //         return 1;
  //       }

  //       return 0;
  //     })
  //     .map((key) => `${key}=${encodeURIComponent(form[key])}`)
  //     .join("&");

  //   // 将qs 加上&p=das41aq6计算md5(16), 从第6位开始取16位
  //   return md5(form.concat("&p=das41aq6")).substr(5, 16);
  // },
};
