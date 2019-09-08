'use strict';

const Service = require('egg').Service;

class RoomService extends Service {

  async getAllRooms() {
    const { ctx } = this;

    const rooms = await ctx.model.Room.findAllRooms();
    return rooms;
  }

  async savaRoom(room) {
    const { ctx } = this;

    await ctx.model.Room.register(room);
  }
}

module.exports = RoomService;
