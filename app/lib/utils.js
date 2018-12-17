'use strict';
const fs = require('fs');

module.exports = {
  dealRoomContent: iterator => {
    iterator.extInfo = JSON.parse(iterator.extInfo);
    let type = '',
      content = '';

    switch (iterator.extInfo.messageObject) {
      case 'text':
        type = '发言';
        content = `【${iterator.extInfo.text}】`;
        break;
      case 'messageBoard':
        type = '发言';
        content = `【${iterator.extInfo.text}】`;
        break;
      case 'faipaiText':
        type = `回复【${iterator.extInfo.faipaiName}】的留言【${iterator.extInfo.faipaiContent}】`;
        content = `【${iterator.extInfo.messageText}】`;
        break;
      case 'idolFlip':
        type = `${iterator.extInfo.idolFlipTitle}`;
        content = `【${iterator.extInfo.idolFlipContent}】`;
        break;
      case 'image':
        type = '图片';
        // content = '[' + JSON.parse(iterator.bodys).url + '][qq 浏览器白名单会拦截]';
        content = '请打开 packet48 查看';
        break;
      default:
        return false;
    }

    // const msg = JSON.stringify(
    //   {
    //     平台: '48',
    //     发送人: iterator.extInfo.senderName,
    //     时间: iterator.msgTimeStr,
    //     类型: type,
    //     内容: content,
    //   }
    // );

    const msg =
        "平台: '口袋48' \n" +
        `发送人: ${iterator.extInfo.senderName} \n` +
        `时间: ${iterator.msgTimeStr} \n` +
        `类型: ${type} \n` +
        '内容:\n' +
        `${content} \n`;
    return msg;
  },

  parseCookieToJson(str) {
    const list = str.split(';');
    const cookieObj = list.reduce((pre, next) => {
      const key = this.Trim(next.split('=')[0]);
      const val = this.Trim(next.split('=')[1]);
      pre[key] = val;
      return pre;
    }, {});
    return cookieObj;
  },

  parseCookieToRequest(str) {
    const list = str.split(';');
    let _json = '{';
    for (let i = 0; i < list.length; i++) {
      try {
        const keys = list[i].split('=');
        const key = this.Trim(keys[0]);
        const value = this.Trim(keys[1]);
        if (i > 0) {
          _json += ';';
        }
        if (isNaN(value)) {
          _json += '"' + key + '":"' + value + '"';
        } else {
          _json += '"' + key + '":' + value;

        }
      } catch (e) {
        continue;
      }
    }
    _json += '}';
    return _json;
  },


  // 替换掉字符串中头尾的空格
  Trim(str) {
    return str.replace(/(^\s*)|(\s*$)/g, '');
  },

  writeToFile(path, data) {
    fs.writeFile(path, data, err => {
      if (err) console.log('写入错误=====', err);
      console.log('写入结束=====');
    });
  },

}
;
