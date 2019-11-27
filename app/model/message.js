'use strict';

const [ PAGE, PAGESIZE ] = [ 1, 10 ]; // 当前页，页大小默认值

module.exports = app => {
  const { INTEGER, DATE } = app.Sequelize;
  const string = app.Sequelize.STRING;


  const Message = app.model.define('message', {
    id: { type: INTEGER, primaryKey: true, autoIncrement: true },
    messageId: {
      type: string(36),
      field: 'message_id',
    },
    roomId: {
      type: string(20),
      field: 'room_id',
    },
    type: {
      type: string(11),
    },
    answerTo: {
      type: string(20),
      field: 'answer_to',
    },
    question: {
      type: string(255),
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

  Message.findOneByMsgId = async function(messageId) {
    const message = await this.findOne({
      where: { messageId },
    });
    return message;
  };

  Message.getUser = async function(name, password) {
    const data = await this.authenticate(name, password);
    return data;
  };


  // 查询指定参数
  Message.queryUser = async function(params) {
    const data = await this.findOne({
      where: params,
      attributes: [ 'id', 'name', 'age' ],
    });
    return data;
  };

  // 查询或新增
  Message.findOrCreateOne = async function(fields) {
    if (fields.password) {
      fields.hashedPassword = Message.hashPassword(fields.password);
      delete fields.password;
    }
    const data = await this.findOrCreate({
      where: fields,
    });
    return data;
  };

  // 根据参数获取用户
  Message.getUserByArgs = function(params, exclude) {
    return this.findOne({
      where: params,
      attributes: {
        exclude: exclude.split(','),
      },
    });
  };


  // 查询用户列表
  Message.getList = function({ params, page, pageSize }) {
    if (!page && !pageSize) {
      return this.findAndCountAll({ where: params });
    }
    page = page || PAGE;
    pageSize = pageSize || PAGESIZE;
    return this.findAndCountAll({
      where: params,
      offset: (page - 1) * pageSize,
      limit: pageSize,
    });
  };

  Message.deleteByArgs = function(args) {
    return this.destroy({
      where: args,
    });
  };

  Message.updateById = function(id, fields) {
    return this.update(fields, {
      where: { id },
    });
  };


  return Message;
};
