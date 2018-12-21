'use strict';


module.exports = appInfo => {
  return {

    keys: 'qbot-node',
    cluster: {
      listen: {
        port: 3000,
        workers: 3,
      },
    },
    cors: {
      origin: '*',
      allowMethods: 'GET,HEAD,PUT,POST,DELETE,PATCH',
    },

    security: {
      enable: false,
      csrf: {
        enable: false,
      },
    },

    io: {
      init: { }, // default: ws // passed to engine.io
      namespace: {
        '/api': {
          connectionMiddleware: [ 'connection' ],
          packetMiddleware: [],
        },

      },
    },

    genMsg: (action, params) => {
      return JSON.stringify(
        {
          action,
          params,
        }
      );
    },


    group_id_test: 947218914, // 调试48 群
    group_id: 947218914, // 正式群
    qq_number: 836851807, // 调试48 群

    target_name: '吕一',
    roomId: 5758972,
    // target_name: '大王',
    // roomId: 5774517, // 袋王
    account: 13023501760,
    password: 'zhiaionly13',


    // 48 info
    api_48: {
      sync: 'https://psync.48.cn/syncsystem/api/cache/v1/update/overview',
      live: 'https://plive.48.cn/livesystem/api/live/v1/memberLivePage',
      liveOpen: 'https://plive.48.cn/livesystem/api/live/v1/openLivePage',
      liveInfo: 'https://plive.48.cn/livesystem/api/live/v1/getLiveOne',
      login: 'https://puser.48.cn/usersystem/api/user/v1/login/phone',
      roomId: 'https://pjuju.48.cn/imsystem/api/im/room/v1/login/user/list',
      roomMain: 'https://pjuju.48.cn/imsystem/api/im/v1/member/room/message/mainpage',
      roomBoard: 'https://pjuju.48.cn/imsystem/api/im/v1/member/room/message/boardpage',
      flip: 'https://ppayqa.48.cn/idolanswersystem/api/idolanswer/v1/question_answer/detail',
    },
    // 48通用headers
    headers: (imei, token) => {
      return {
        'Content-Type': 'application/json',
        version: '5.3.2',
        os: 'Android',
        build: 0,
        token,
        imei,
      };
    },


    // modian info
    modian_id: '41903',
    target_site: 'https://zhongchou.modian.com/item/41903',
    modian_detail_url: 'https://wds.modian.com/api/project/detail',
    modian_order_url: 'https://wds.modian.com/api/project/orders',
    modian_juju_url: 'https://wds.modian.com/api/project/rankings',

    modian_headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.90 Safari/537.36',
      'content-type': 'application/x-www-form-urlencoded',
    },


    // weibo info
    weiboId: 6021143413, // 目标人微博id


    config_db: {
      // imei: '',
      // token: 'jTEA76rYFmdKA4KSCePzkQccRLxMbx4/JVQ91B23tN+XLT8x1ZU8X0w4GnP0eKggOY4eAF9ifbM=',
      // last_room_content_ids: new Set([]),
      // last_weibo_content_id: [], //最新微博的 id
      // modian_user_list: [],
    },

  };
};
