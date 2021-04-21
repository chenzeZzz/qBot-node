'use strict';

module.exports = app => {
  const { INTEGER, DATE } = app.Sequelize;
  const string = app.Sequelize.STRING;


  const Token = app.model.define('token', {
    id: { type: INTEGER, primaryKey: true, autoIncrement: true },
    token: {
      type: string(255),
      field: 'token',
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
  Token.register = async function(fields) {
    const data = await this.create(fields);
    return data.toJSON();
  };

  Token.UpdateToken = async function(token) {
    const data = await this.update({ token }, {
      where: {
        id: 1,
      },
    });
    console.log('dat====', data);
    return data;
  };

  // =========================== query =========================

  Token.findOneById = async function() {
    const room = await this.findOne({
      where: { id: 1 },
    });
    return room;
  };


  return Token;
};
