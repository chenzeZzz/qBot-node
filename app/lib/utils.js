'use strict';
const zlib = require('zlib');

const TaoBaSalt = '%#54$^%&SDF^A*52#@7';

function addSalt(data) {
  for (let index = 0; index < data.length; index++) {
    if (index % 2 === 0) {
      data[index] =
        data[index] ^
        TaoBaSalt[Math.floor(index / 2) % TaoBaSalt.length].charCodeAt();
    }
  }
  return data;
}

function decodeData(originText) {
  return new Promise((res, rej) => {
    const source = originText.split('$')[1];
    // base64解码 加盐
    const decodeB64 = addSalt(Buffer.from(source, 'base64'));

    zlib.unzip(decodeB64, (err, buffer) => {
      if (err) {
        rej(err);
      }
      const bufferToJson = JSON.parse(decodeURIComponent(buffer.toString()));
      res(bufferToJson);
    });
  });
}

// 生成 48登录请求 hearder 种的 imei
function genImei() {
  const randomNum = function(minNum, maxNum) {
    switch (arguments.length) {
      case 1:
        return parseInt(Math.random() * minNum + 1, 10);
      case 2:
        return parseInt(Math.random() * (maxNum - minNum + 1) + minNum, 10);
      default:
        return 0;
    }
  };
  const r1 = 1000000 + randomNum(0, 8999999);
  const r2 = 1000000 + randomNum(0, 8999999);
  const input = r1 + '' + r2;
  let a = 0;
  let b = 0;
  for (let i = 0; i < input.length; i++) {
    const tt = parseInt(input.slice(i, i + 1));
    if (i % 2 === 0) {
      a = a + tt;
    } else {
      const temp = tt * 2;
      b = b + temp / 10 + (temp % 10);
    }
  }
  let last = Math.round((a + b) % 10);
  if (last === 0) {
    last = 0;
  } else {
    last = 10 - last;
  }
  return input + '' + last;
}

module.exports = {
  addSalt,
  decodeData,
  genImei,
};
