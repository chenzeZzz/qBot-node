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
    group_id: '', // 正式 群
    group_id_test: '', // 调试48 群
    qq_number: '', // 调试48 群


    config_48: {
      api: {
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

      imei: '',
      token: '',
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

      genMsg: (action, params) => {
        return JSON.stringify(
          {
            action,
            params,
          }
        );
      },
      target_name: '',
      roomId: '',
      // target_name: '大王',
      // roomId: 5774517, // 袋王
      account: '',
      password: '',
      // last_room_content_ids: new Set([

      //   'e2ef3df0-8184-46fd-88ff-5c1f94c79840',
      //   '227e7af1-0393-4feb-b2b6-937a1c986821',
      //   'd45fabfc-aa2a-4a21-96a2-5e7f9b83cd6e',
      //   '08e2019e-0148-4473-8156-a8a325fdd3a6',
      //   '1ba8543d-db49-4cf0-b056-81ac7388a52d',
      //   '01f8f3ae-f13c-481e-92b9-bad5e567c504',
      //   '66e21885-bf45-4ecb-b233-ff7da4e2af87',
      //   '7bc52179-8e82-4841-8740-bbb4fc0f1766',
      //   'e36f1f02-9ca1-4e8b-89b6-b5ea08f12159',
      //   'e75927a3-dcd5-4336-bb8c-35361034f788',

      // ]),
      weiboId: '', // 目标人微博id

      // last_weibo_content_id: 'M_H4EElCyAK', //最新微博的 id
    },
    // https://m.weibo.cn/api/container/getIndex?containerid=230413{id}_-_WEIBO_SECOND_PROFILE_WEIBO&page=1

  };
};
