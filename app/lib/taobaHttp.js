'use strict';
const axios = require('axios');
const HttpsProxyAgent = require('https-proxy-agent');

const utils = require('./utils');

// Set config defaults when creating the instance
// const requestInstance = axios.create({
//   proxy: {
//     host: '175.42.68.10',
//     port: 9999,
//   },
// });


// 115.204.35.187:22150
// 123.169.35.154:50989
// 120.6.42.74:30622
// 101.25.134.215:28759
// 120.6.39.71:36050
// 182.121.208.255:21920
// 36.25.108.66:43330
// 59.62.42.8:36797
// 119.133.87.225:28543
// 60.182.32.166:35770

// 60.169.126.14:43966
// 123.162.0.96:26634
// 115.210.68.169:21141
// 101.205.53.0:38990
// 36.25.41.163:49703
// 58.208.245.6:30259
// 42.202.42.225:48862
// 27.152.192.17:22585
// 49.72.27.224:39490
// 144.255.149.109:29560

const httpsAgent = new HttpsProxyAgent('http://49.72.27.224:39490');

async function getJiZiDetail(config) {
  const params = {
    id: config.taoba.taobaId,
    requestTime: new Date().getTime(),
    pf: 'h5',
  };
  const result = await axios({
    method: 'POST',
    url: config.taoba.detail,
    headers: config.taoba.headers,
    data: JSON.stringify(params),
  });

  const data = await utils.decodeData(result.data);
  if (data.code === 0) {
    return data.datas;
  }
}

/**
   * Get rank info from Taoba
   * @param {string} taobaId 订单号
   */
async function getRankInfoFromTaoba(config) {
  const params = {
    id: config.taoba.taobaId,
    requestTime: new Date().getTime(),
    _version_: 1,
    pf: 'h5',
  };
  const result = await axios({
    method: 'POST',
    url: config.taoba.rankUrl,
    headers: config.taoba.headers,
    data: JSON.stringify(params),
  });

  const data = await utils.decodeData(result.data);

  if (data.code === 0) {
    return data.list;
  }
}


/**
   * Get pkgroup
   */
async function _getPkgroupFromTaoba(config) {
  const params = {
    id: config.taoba.taobaPKId,
    requestTime: new Date().getTime(),
    _version_: 1,
    pf: 'h5',
  };
  const result = await axios({
    method: 'POST',
    url: config.taoba.pkDetailUrl,
    headers: config.taoba.headers,
    data: JSON.stringify(params),
  });
  const data = await utils.decodeData(result.data);
  if (data.code === 0) {
    return data.datas.pkgroup;
  }
}

/**
   * Get rank info from Taoba
   */
async function getPkstatsFromTaoba(config) {
  const pkgroup = await _getPkgroupFromTaoba(config);
  const params = {
    pkgroup,
    requestTime: new Date().getTime(),
    _version_: 1,
    pf: 'h5',
  };
  const result = await axios({
    method: 'POST',
    url: config.taoba.pkUrl,
    headers: config.taoba.headers,
    data: JSON.stringify(params),
  });
  const data = await utils.decodeData(result.data);
  if (data.code === 0) {
    return data.list;
  }
}

module.exports = {
  getJiZiDetail,
  getRankInfoFromTaoba,
  getPkstatsFromTaoba,
};
