'use strict';
const util = require('../utils/util');
const puppeteer = require('puppeteer');
const weiboAccount = require('../config.json').weiboAccount;
let browser = null;
let page = null;

function getPageData() {
  const pageData = [];
  document.querySelectorAll('.c[id]').forEach(ele => {
    const title = ele.querySelector('.ctt').innerText;
    const content = ele.querySelector('.ctt').innerHTML;
    const feedtime = ele.querySelector('.ct').innerHTML;
    const url = ele.querySelector('.cc').href;
    pageData.push({ title, content, feedtime, url });
  });

  return pageData;
}

async function initBroswer() {
  browser = await puppeteer.launch({ headless: true });
  page = await browser.newPage();
}

async function loginWeibo() {
  try {
    await page.goto(util.loginUrl, { waitUntil: 'networkidle2' });

    // 模拟登录
    await page.$eval(
      '#loginName',
      (ele, username) => {
        ele.value = username;
      },
      weiboAccount.username
    );
    await page.$eval(
      '#loginPassword',
      (ele, password) => {
        ele.value = password;
      },
      weiboAccount.password
    );
    await page.keyboard.press('Enter');

    // 等发微博框出现表示登录成功
    await page.waitFor('.m-text-cut');
  } catch (error) {
    util.log(error.toString(), 'error');
    return subscribe;
  }
}

async function closeBroswer() {
  await page.close();
  await browser.close();
}

async function crawleWeibo(subscribe) {
  try {
    // 跳转到指定的微博页
    await page.goto(util.url(subscribe.uid, 1), { waitUntil: 'networkidle2' });

    // 等待页面加载完毕
    await page.waitFor('[name="mp"]');

    // 获取总页数
    const totalPage = await page.$eval('[name="mp"]', ele => {
      return parseInt(ele.value);
    });

    // 获取昵称
    subscribe.uname = await page.title();

    // 循环每一页
    page: for (let j = 1; j < totalPage; j++) {
      if (j > 1) {
        // 跳转到指定的微博页
        await page.goto(util.url(subscribe.uid, j), {
          waitUntil: 'networkidle2',
        });

        // 等待页面加载完毕
        await page.waitFor('[name="mp"]');
      }

      // 获取页面中的数据
      const pageData = await page.evaluate(getPageData);

      // 分析数据，判断是否需要加载下一页
      for (let l = 0; l < pageData.length; l++) {
        const item = pageData[l];
        // 处理奇奇怪怪的时间
        const feedtime = util.procTime(item.feedtime);
        // 若微博发布时间晚于最后抓取时间则需要入库，
        if (util.after(feedtime, subscribe.last_crawle_time)) {
          item.feedtime = feedtime;
          subscribe.rows.push(item);
        } else {
          // 抓取到的数据是按照时间逆序，遇到一条不符合条件则后续的均不符合,直接跳出循环
          break page;
        }
      }
    }
  } catch (error) {
    util.log(error.toString(), 'error');
    return subscribe;
  }
  return subscribe;
}

module.exports = {
  initBroswer,
  loginWeibo,
  crawleWeibo,
  closeBroswer,
};
