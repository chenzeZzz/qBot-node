'use strict';

const Controller = require('egg').Controller;

class HomeController extends Controller {
  constructor() {
    console.log('arguments-====', arguments);
  }
  async index() {
    console.log('==body====', this.ctx.request.body);
    console.log('==query====', this.ctx.request.query);
    console.log('==params====', this.ctx.params);
    console.log('===headers===', this.ctx.request.headers);
    this.app.io.of('/api').emit();
    this.ctx.body = 'Hello world';
  }
}

module.exports = HomeController;
