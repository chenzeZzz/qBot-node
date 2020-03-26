'use strict';

const [ PAGE, PAGESIZE ] = [ 1, 10 ]; // 当前页，页大小默认值

module.exports = app => {
  const { INTEGER, DATE } = app.Sequelize;
  const string = app.Sequelize.STRING;


  const Message = app.model.define('weibo', {
    id: { type: INTEGER, primaryKey: true, autoIncrement: true },
    weiboId: {
      type: string(36),
      field: 'weibo_id',
    },
    content: {
      type: string(255),
    },
    createdAt: {
      field: 'created_at',
      type: DATE,
    },
    updatedAt: {
      field: 'updated_at',
      type: DATE,
    },
  }, {
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    freezeTableName: true,
  });


  // =========================== update =========================
  // static methods
  Message.register = async function(fields) {
    const data = await this.create(fields);
    return data.toJSON();
  };

  // =========================== query =========================

  Message.findOneByWeiboId = async function(weiboId) {
    const data = await this.findOne({
      where: { weiboId },
    });
    return data;
  };



  return Message;
};
