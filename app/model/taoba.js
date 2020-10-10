'use strict';

module.exports = app => {
  const { INTEGER, DATE } = app.Sequelize;
  const string = app.Sequelize.STRING;

  const Taoba = app.model.define(
    'taoba',
    {
      id: { type: INTEGER, primaryKey: true, autoIncrement: true },
      taobaId: {
        type: string(36),
        field: 'taoba_id',
      },
      listId: {
        type: string(36),
        field: 'list_id',
      },
      money: {
        type: string(20),
      },
      uid: {
        type: string(20),
      },
      nick: {
        type: string(30),
      },
      stime: {
        type: DATE,
      },
      createdAt: {
        field: 'created_at',
        type: DATE,
      },
      updatedAt: {
        field: 'updated_at',
        type: DATE,
      },
    },
    {
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
      freezeTableName: true,
    }
  );

  // =========================== update =========================
  // static methods
  Taoba.batchRegister = async function(fields) {
    const data = await this.bulkCreate(fields);
    return data;
  };

  // =========================== query =========================

  Taoba.findLastOneTaobaId = async function(taobaId) {
    const data = await this.findOne({
      where: { taobaId },
      limit: 1,
      order: [[ 'stime', 'DESC' ]],
    });
    return data;
  };

  return Taoba;
};
