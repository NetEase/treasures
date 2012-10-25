var pomelo = require('pomelo');
var channelService = pomelo.channelService;
var area = require('./area');
var EntityType = require('../consts/consts').EntityType;

var exp = module.exports;

exp.pushMessage = function (msg, cb) {
  area.channel().pushMessage(msg, cb);
};

exp.pushMessageByUids = function (msg, uids, cb) {
  channelService.pushMessageByUids(msg, uids, cb);
};

exp.pushMessageToPlayer = function (route, msg, cb) {
  var uids = [route];
  exp.pushMessageByUids(msg, uids, cb);
};

