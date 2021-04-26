'use strict';
const axios = require('axios');
const HttpsProxyAgent = require('https-proxy-agent');

const utils = require('./utils');
const httpsAgent = new HttpsProxyAgent('http://forward.xdaili.cn:80');

async function getJiZiDetail(id, config) {
  const params = {
    id,
    requestTime: new Date().getTime(),
    pf: 'h5',
  };
  const result = await axios({
    method: 'POST',
    url: config.taoba.detail,
    headers: config.taoba.headers,
    data: JSON.stringify(params),
    agent: httpsAgent,
    rejectUnauthorized: false,
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
async function getRankInfoFromTaoba(id, config) {
  const params = {
    id,
    requestTime: new Date().getTime(),
    _version_: 1,
    pf: 'h5',
  };
  const result = await axios({
    method: 'POST',
    url: config.taoba.rankUrl,
    headers: config.taoba.headers,
    data: JSON.stringify(params),
    agent: httpsAgent,
    rejectUnauthorized: false,
  });

  const data = await utils.decodeData(result.data);

  if (data.code === 0) {
    return data.list;
  }
}


/**
   * Get pkgroup
   */
async function _getPkgroupFromTaoba(id, config) {
  const params = {
    id,
    requestTime: new Date().getTime(),
    _version_: 1,
    pf: 'h5',
  };
  const result = await axios({
    method: 'POST',
    url: config.taoba.pkDetailUrl,
    headers: config.taoba.headers,
    data: JSON.stringify(params),
    agent: httpsAgent,
    rejectUnauthorized: false,
  });
  const data = await utils.decodeData(result.data);
  if (data.code === 0) {
    return data.datas.pkgroup;
  }
}

/**
   * Get rank info from Taoba
   */
async function getPkstatsFromTaoba(id, config) {
  const pkgroup = await _getPkgroupFromTaoba(id, config);
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
    agent: httpsAgent,
    rejectUnauthorized: false,
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
