"use strict";

const Service = require("egg").Service;

class TaobaService extends Service {
  async getLastTaobaRecordByTaobaId(id) {
    const { ctx } = this;
    const data = await ctx.model.Taoba.findLastOneTaobaId(id);
    return data;
  }

  async savaTaoba(data) {
    const { ctx } = this;

    await ctx.model.Taoba.batchRegister(data);
  }
}

module.exports = TaobaService;
