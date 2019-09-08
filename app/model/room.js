'use strict';

module.exports = app => {
  const { INTEGER, DATE } = app.Sequelize;
  const string = app.Sequelize.STRING;


  const Room = app.model.define('room', {
    id: { type: INTEGER, primaryKey: true, autoIncrement: true },
    roomId: {
      type: string(36),
      field: 'room_id',
    },
    ownerId: {
      type: string(36),
      field: 'owner_id',
    },
    ownerName: {
      type: string(20),
      field: 'owner_name',
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
  Room.register = async function(fields) {
    const data = await this.create(fields);
    return data.toJSON();
  };

  // =========================== query =========================

  Room.findOneByMsgId = async function(roomId) {
    const room = await this.findOne({
      where: { roomId },
    });
    return room;
  };

  Room.findAllRooms = async function() {
    const rooms = await this.findAll();
    return rooms;
  };


  return Room;
};
