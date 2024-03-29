'use strict';

const moment = require('moment');

const socket = require('../lib/socket_instance');
const taobaHttp = require('../lib/taobaHttp');

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

      client.onerror = function(error) {
        console.log('Connection Error: ', error);
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
                await that.sendNormalInfo(config.taoba.taobaId, event_data.message);
                break;

              case 'pk':
                // await that.sendNormalInfo(config.taoba.taobaId2, event_data.message);

                await that.sendPKInfo(config.taoba.taobaPKId, event_data.message); // pk 集资信息
                break;

              case '微博':
                try {
                  const result = await that.isWeiboUpdate();
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

              case '合成吕一':
              case '合成口口一':
                client.send(
                  config.genMsg('send_group_msg', {
                    group_id: config.group_id,
                    message: 'http://plashspeed.top/xigua/game?id=816e75df',
                  })
                );
                break;
              case '安利':
                client.send(
                  config.genMsg('send_group_msg', {
                    group_id: config.group_id,
                    message: 'https://b23.tv/8doF1Y',
                  })
                );
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
            const msg =
              `欢迎 [CQ:at,qq=${event_data.user_id}] 加入SNH48-吕一应援群~ \n` +
              '找吕一： \n' +
              '微博：@SNH48-吕一 ：http://weibo.com/u/6021143413 \n' +
              'B站：臭脚番茄 ：http://space.bilibili.com/11399736 \n' +
              '找应援会： \n' +
              '微博：http://weibo.com/u/5742612817 \n' +
              'B站 : https://space.bilibili.com/57253753 \n' +
              `集资连接：${config.target_site_origin + config.taoba.taobaId} \n` +
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


  // 发送 pk 集资信息
  async sendPKInfo(taobaId, keyword) {
    const config = this.config;

    try {
      if (!taobaId) {
        this.socket_qbot.send(
          config.genMsg('send_group_msg', {
            group_id: config.group_id,
            message: '目前没有集资活动!',
          })
        );
        return false;
      }


      const pkstats = await taobaHttp.getPkstatsFromTaoba(taobaId, config);
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

      const msg =
        `${masterItem.title} \n` +
        ' \n' +
        `已筹: ${masterItem.donation} 元\n` +
        `排名: ${rankIndex + 1} 名\n` +
        `${rankInfo}` +
        `集资截止时间: ${moment(masterItem.expire * 1000).format(
          'YYYY-MM-DD'
        )} \n` +
        `集资链接: ${config.target_site_origin + taobaId} \n` +
        `输入 ${keyword} 查看详情`;

      this.socket_qbot.send(
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
  async sendNormalInfo(taobaId, keyword) {
    const client = this.getSocket();
    const config = this.config;

    try {
      if (!taobaId) {
        this.socket_qbot.send(
          config.genMsg('send_group_msg', {
            group_id: config.group_id,
            message: '目前没有集资活动!',
          })
        );
        return false;
      }
      const data = await taobaHttp.getJiZiDetail(taobaId, config);
      const msg =
        `${data.title} \n` +
        ' \n' +
        `完成金额: ${data.donation} \n` +
        `目标金额: ${data.amount} \n` +
        `支持进度: ${Number(data.percent).toFixed(2)}% \n` +
        `截止时间: ${moment(data.expire * 1000).format(
          'YYYY-MM-DD'
        )} \n` +
        `集资链接: ${config.target_site_origin + taobaId} \n` +
        `输入 ${keyword} 查看详情`;
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
};
