// Module dependencies
var area = require('../../../models/area');
var Player = require('../../../models/player')
var Move = require('../../../models/action/move');
// var channelService = require('pomelo').channelService;
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
  var role = dataApi.role.random();
  var player = new Player({id: msg.playerId, name: msg.name, kindId: role.id});

  player.serverId = session.frontendId;
  // console.log(player);

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
  var playerId = session.get('playerId');
  var player = area.getPlayer(playerId);
  if (!player) {
    logger.error('Move without a valid player ! playerId : %j', playerId);
    next(new Error('invalid player:' + playerId), {
      code: consts.MESSAGE.ERR
    });
    return;
  }

  var target = area.getEntity(msg.target);
  player.target = target ? target.entityId : null;

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

    area.getChannel().pushMessage({route: 'onMove', entityId: player.entityId, endPos: endPos});
  }
};

