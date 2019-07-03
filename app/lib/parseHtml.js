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
    try {
      const last_weibo_id = slideList['2'].attribs.id;
      const target_weibo_content = slideList['2'].children[0].children[0].children;
      // console.log('xixixiixxi', slideList['1'].children[0].children[3]);

      // const last_weibo_id = slideList['1'].attribs.id;
      // const target_weibo_content = slideList['1'].children[0].children[3].children;
      // console.log('slideList====', slideList['2'].children[0].children[0].children);

      let content = '';
      for (const item of target_weibo_content) {

        switch (item.type) {
          case 'text':
            content += `${item.data}`;
            break;
          case 'tag':
            if (item.name === 'br') {
              content += '\n';
            }
            break;
          default:
            break;
        }
      }
      return { last_weibo_id, content };
    } catch (error) {
      console.log('微博爬虫失败===', error);
      // TODO 发送给test
      throw new Error('微博爬虫失败')
    }


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
