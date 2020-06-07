"use strict";
const zlib = require("zlib");

const TaoBaSalt = "%#54$^%&SDF^A*52#@7";

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
    const source = originText.split("$")[1];
    // base64解码 加盐
    const decodeB64 = addSalt(Buffer.from(source, "base64"));

    zlib.unzip(decodeB64, (err, buffer) => {
      if (err) {
        rej(err);
      }
      const bufferToJson = JSON.parse(decodeURIComponent(buffer.toString()));
      res(bufferToJson);
    });
  });
}

module.exports = {
  addSalt,
  decodeData,
};
