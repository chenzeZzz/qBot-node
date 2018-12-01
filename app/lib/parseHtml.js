'use strict';
const cheerio = require('cheerio');


module.exports = {
  getWeiboContent: html => {
    // 沿用JQuery风格，定义$
    const $ = cheerio.load(html);
    // 根据id获取轮播图列表信息
    const slideList = $('.c');
    // 轮播图数据
    const slideListData = [];

    const last_weibo_id = slideList['2'].attribs.id;
    // console.log('slideList====', slideList['2'].attribs.id);
    return last_weibo_id;
    /* 轮播图列表信息遍历 */
    // slideList.find('li').each(function(item) {

    //   const pic = $(this);
    //   // 找到a标签并获取href属性
    //   const pic_href = pic.find('a').attr('href');
    //   // 找到a标签的子标签img并获取_src
    //   const pic_src = pic.find('a').children('img').attr('_src');
    //   // 找到a标签的子标签img并获取alt
    //   const pic_message = pic.find('a').children('img').attr('alt');
    //   // 向数组插入数据
    //   slideListData.push({
    //     pic_href,
    //     pic_message,
    //     pic_src,
    //   });
    // });
  },
};
