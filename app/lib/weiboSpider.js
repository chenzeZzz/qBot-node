/* eslint-disable no-unused-vars */
'use strict';

const request = require('request');
const Iconv = require('iconv-lite');
const cp = require('child_process');

let last_cookie = require('../../db/weiboCookie.json').cookie;
const cheerio = require('./parseHtml');

const sleep = (timeountMS) => new Promise((resolve) => {
  setTimeout(resolve, timeountMS);
});

class WeiboSpider {

  constructor(target_id) {
    // this.getLastWeibo();
    this.instance = null;

    this.target_id = target_id; // 用户id，即需要我们输入的数字，如昵称为“Dear-迪丽热巴”的id为1669879400
    this.filter = 0; // 取值范围为0、1，程序默认值为0，代表要爬取用户的全部微博，1代表只爬取用户的原创微博
    this.username = ''; // 用户名，如“Dear-迪丽热巴”
    this.weibo_num = 0; // 用户全部微博数
    this.weibo_num2 = 0;	 // 爬取到的微博数
    this.following = 0; // 用户关注数
    this.followers = 0; // 用户粉丝数
    this.weibo_content = [];	 // 微博内容
    this.weibo_place = []; // 微博位置
    this.publish_time = []; // 微博发布时间
    this.up_num = []; // 微博对应的点赞数
    this.retweet_num = []; // 微博对应的转发数
    this.comment_num = []; // 微博对应的评论数
    this.publish_tool = []; // 微博发布工具
  }

  static getWeiboSpiderInstance(target_id) {
    if (!target_id) target_id = 6021143413;
    if (this.instance) return this.instance;
    this.instance = new WeiboSpider(target_id);
    return this.instance;
  }




  exec(){
    return new Promise((res, rej) => {
      const curlCommand = `curl 'https://weibo.cn/u/6021143413?filter=0&page=1'  -H 'cookie: ${last_cookie}' --compressed`
      cp.exec(curlCommand, (err, stdout, stderr) => {
        if (!err && stdout) {
          // const data = Iconv.decode(stdout, 'utf-8').toString();
          // console.log('data===', stdout);
          try {
            const weibo_data = cheerio.getWeiboContent(stdout);
            // console.log('weibo_data======', weibo_data)

            res(weibo_data);
          } catch (error) {
            rej(error);
          }
        }
      });
    })
  }

  async getRemoteLastWeibo() {
    await sleep(Math.random() * 20000)
    await this.exec()
  };

}

module.exports = WeiboSpider
;
