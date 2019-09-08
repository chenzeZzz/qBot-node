/* eslint-disable no-unused-vars */
'use strict';

const request = require('request');
const Iconv = require('iconv-lite');
const cp = require('child_process');

let last_cookie = require('../../db/weiboCookie.json').cookie;
const cheerio = require('./parseHtml');


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

  async getRemoteLastWeibo() {
    const prefix_url = 'https://weibo.cn';
    // https://weibo.cn/u/6021143413?filter=0&page=1
    const target_url = `https://weibo.cn/u/${this.target_id}?filter=0&page=1`;
    // format cookie<String> into cookie<request.jar>
    // const Cookie = util.parseCookieToRequest(last_cookie);

    // 这边有个巨坑, 哎, 你自己踩吧，痛苦后才能永恒！祝福你
    return new Promise((res, rej) => {
      // const jar = request.jar();
      // last_cookie.split(';').forEach(x => {
      //   x = x.trim();
      //   jar.setCookie(request.cookie(x), prefix_url);
      // });

      last_cookie = `Cookie: ${last_cookie}`;

      cp.exec(`curl -X GET 'https://weibo.cn/u/6021143413?filter=0&page=1' -H '${last_cookie}' -H 'pragma: no-cache' -H 'cache-control: no-cache' -H 'upgrade-insecure-requests: 1' -H 'user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.142 Safari/537.36' -H 'accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3' -H 'accept-language: en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7'`, (err, stdout, stderr) => {
      // cp.exec(`curl -H 'Host: weibo.cn' -H '${last_cookie}' -H 'pragma: no-cache' -H 'cache-control: no-cache' -H 'upgrade-insecure-requests: 1' -H 'user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.142 Safari/537.36' -H 'accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3' -H 'accept-language: en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7' --compressed 'https://weibo.cn/u/6021143413?filter=0&page=1'`, (err, stdout) => {
        if (!err && stdout) {
          // const data = Iconv.decode(stdout, 'utf-8').toString();
          console.log('data===', stdout);
          try {
            const weibo_data = cheerio.getWeiboContent(stdout);
            res(weibo_data);
          } catch (error) {
            rej(error);
          }
        }
      });
      // request({
      //   encoding: null,
      //   method: 'GET',
      //   url: target_url,
      //   jar,
      //   headers: {
      //     // cookie: Cookie,
      //     'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.142 Safari/537.36',
      //     accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3',
      //     // 'Content-Type': 'application/x-www-form-urlencoded',
      //   },
      // }, function(error, response, body) {
      //   if (!error && response.statusCode === 200) {
      //     const data = Iconv.decode(body, 'utf-8').toString();
      //     console.log('data===', data);
      //     try {
      //       const weibo_data = cheerio.getWeiboContent(data);
      //       res(weibo_data);
      //     } catch (error) {
      //       rej(error);
      //     }
      //   }
      // });
    });
  }

}

module.exports = WeiboSpider
;
