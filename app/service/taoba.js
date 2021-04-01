'use strict';
const Service = require('egg').Service;

class TaobaService extends Service {
  async getLastTaobaRecordByTaobaId(id) {
    const { ctx } = this;
    const data = await ctx.model.Taoba.findLastOneTaobaId(id);
    return data;
  }

  async getAll(taobaId) {
    const { ctx } = this;
    const data = await ctx.model.Taoba.findAll({
      where: { taobaId },
      order: [[ 'list_id', 'DESC' ]],
    });
    return data;
  }


  async savaTaoba(data) {
    const { ctx } = this;

    await ctx.model.Taoba.batchRegister(data);
  }

  async deleteAllByTaobaoId(taobaId) {
    const { ctx } = this;

    await ctx.model.Taoba.destroy({
      where: { taobaId },
    });
  }
}

module.exports = TaobaService;
