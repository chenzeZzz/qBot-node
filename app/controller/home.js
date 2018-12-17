'use strict';

const Controller = require('egg').Controller;

class HomeController extends Controller {
  async index() {
    this.app.io.of('/api').emit();
    this.ctx.body = 'Hello world';
  }
}

module.exports = HomeController;
