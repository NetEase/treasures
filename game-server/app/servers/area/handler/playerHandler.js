// Module dependencies
var area = require('../../../models/area');
var Player = require('../../../models/player')
//var messageService = require('../../../domain/messageService');
//var world = require('../../../domain/world');
var Move = require('../../../models/action/move');
//var actionManager = require('../../../domain/action/actionManager');
var channelService = require('pomelo').channelService;
var logger = require('pomelo-logger').getLogger(__filename);
var app = require('pomelo').app;
var consts = require('../../../consts/consts');
var dataApi = require('../../../util/dataApi');
var fs = require('fs');

var handler = module.exports;

/**
 * Player enter scene, and response the related information such as
 * playerInfo, areaInfo and mapData to client.
 *
 * @param {Object} msg
 * @param {Object} session
 * @param {Function} next
 * @api public
 */
handler.enterScene = function(msg, session, next) {
  var player = new Player({id: msg.playerId, name: msg.name, kindId: '1001'});

  player.serverId = session.frontendId;
  console.log(player);

  if (!area.addEntity(player)) {
    logger.error("Add player to area faild! areaId : " + player.areaId);
    next(new Error('fail to add user into area'), {
      route: msg.route,
      code: consts.MESSAGE.ERR
    });
    return;
  }

  next(null, {
    code: consts.MESSAGE.RES,
    data: {
      area: area.getAreaInfo(), 
      playerId: player.id
    }
  });
};

/**
 * Get player's animation data.
 *
 * @param {Object} msg
 * @param {Object} session
 * @param {Function} next
 * @api public
 */
var animationData = null;
handler.getAnimation = function(msg, session, next) {
  var path = '../../../../config/animation_json/';
  if (!animationData) {
    var dir = './config/animation_json';
    var name, reg = /\.json$/;
    animationData = {};
    fs.readdirSync(dir).forEach(function(file) {
      if (reg.test(file)) {
        name = file.replace(reg, '');
        animationData[name] = require(path + file);
      }
    });
  }  
  next(null, {
    code: consts.MESSAGE.RES,
    data: animationData
  });
};

/**
 * Player moves. Player requests move with the given movePath.  
 * Handle the request from client, and response result to client
 *
 * @param {Object} msg
 * @param {Object} session
 * @param {Function} next
 * @api public
 */
handler.move = function(msg, session, next) {
  var endPos = msg.targetPos;
  var playerId = session.playerId;
  var player = area.getPlayer(playerId);
  if (!player) {
    logger.error('Move without a valid player ! playerId : %j', playerId);
    next(new Error('invalid player:' + playerId), {
      code: consts.MESSAGE.ERR
    });
    return;
  }

  player.target = null;

  if (endPos.x > area.width() || endPos.y > area.height()) {
    logger.warn('The path is illigle!! The path is: %j', msg.path);
    next(new Error('fail to move for illegal path'), {
      code: consts.MESSAGE.ERR
    });

    return;
  }

  var action = new Move({
    entity: player,
    endPos: endPos,
  });

  if (area.timer().addAction(action)) {
    next(null, {
      code: consts.MESSAGE.RES,
      sPos: player.getPos()
    });
    area.channel().pushMessage({route: 'onMove', entityId: player.entityId, endPos: endPos});
  }
};


/**
 * Player pick up item. 
 * Handle the request from client, and set player's target
 * 
 * @param {Object} msg
 * @param {Object} session
 * @param {Function} next
 * @api public
 */

handler.pickItem = function(msg, session, next) {
  var player = area.getPlayer(session.playerId);
  var target = area.getEntity(msg.targetId);
  if(!player || !target || (target.type !== consts.EntityType.ITEM && target.type !== consts.EntityType.EQUIPMENT)){
    logger.error("can't find player or target! areaId : %j, playerId : %j, targetId : %j", session.areaId, session.playerId, msg.targetId);
    next(new Error('invalid player or target'), {
      route: msg.route,
      code: consts.MESSAGE.ERR
    });
    return;
  }

  player.target = target.entityId;
  next(null, {
    route: msg.route,
    code: consts.MESSAGE.RES
  });
};

