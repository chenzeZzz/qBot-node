'use strict';

// 参考 https://github.com/jydeng/weibo-crawler/blob/master/index.js

const util = require('./utils/util');
const subscribes = require('./models/subscribe');
const feeds = require('./models/feeds');
const {
  initBroswer,
  loginWeibo,
  crawleWeibo,
  closeBroswer,
} = require('./crawler/crawler');
const interval = require('./config.json').interval;
const intervalDesc = require('./config.json').intervalDesc;
const schedule = require('node-schedule');

const job = schedule.scheduleJob(interval, main);

async function main() {
  util.log('开始任务。');

  const allSubscribe = await subscribes.selectSubscribe();
  util.log(`一共订阅了 ${allSubscribe.length} 个微博。`);

  await initBroswer();

  await loginWeibo();

  for (let i = 0; i < allSubscribe.length; i++) {
    const subscribe = allSubscribe[i];
    subscribe.rows = [];

    util.log(`微博: ${subscribe.uid} 开始爬取。`);

    const result = await crawleWeibo(subscribe);

    if (result.rows.length) {
      util.log(
        `微博: ${subscribe.uid} 自 ${subscribe.last_crawle_time} 后更新了${
          result.rows.length
        } 条微博。`
      );

      const last = result.rows[0];
      await subscribes.updateSubscribe(
        result.uid,
        result.uname,
        last.title,
        last.url,
        last.feedtime
      );

      for (let j = 0; j < result.rows.length; j++) {
        const feed = result.rows[j];
        await feeds.addFeeds(result.uid, feed.content, feed.url, feed.feedtime);
      }

      util.log(`微博: ${subscribe.uid} 任务完成。`);
    } else {
      util.log(
        `微博:${subscribe.uname}自${subscribe.last_crawle_time} 后没有更新。`
      );
    }
  }

  await closeBroswer();

  util.log('任务完成。');
}

main();

util.log(`启动成功,${intervalDesc}。`);
