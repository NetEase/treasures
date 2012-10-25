// Module dependencies
var area = require('../../../models/area');
//var messageService = require('../../../domain/messageService');
//var world = require('../../../domain/world');
//var Move = require('../../../domain/action/move');
//var actionManager = require('../../../domain/action/actionManager');
var channelService = require('pomelo').channelService;
var logger = require('pomelo-logger').getLogger(__filename);
var app = require('pomelo').app;
var consts = require('../../../consts/consts');
var dataApi = require('../../../util/dataApi');

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
  var playerId = session.playerId;
  var areaId = session.areaId;

  userDao.getPlayerAllInfo(playerId, function(err, player) {
    if (err || !player) {
      logger.error('Get user for userDao failed! ' + err.stack);
      next(new Error('fail to get user from dao'), {
        route: msg.route,
        code: consts.MESSAGE.ERR
      });

      return;
    }

    player.serverId = session.frontendId;
    if (!area.addEntity(player)) {
      logger.error("Add player to area faild! areaId : " + player.areaId);
      next(new Error('fail to add user into area'), {
        route: msg.route,
        code: consts.MESSAGE.ERR
      });
      return;
    }
    var opts = {
      name: 'area_' + areaId,
      create: true
    };
    app.rpc.chat.chatRemote.add(session, msg.uid, session.frontendId, player.name, opts, function(data){});
		var map = area.map();
		next(null, {
			code: consts.MESSAGE.RES,
			data: {
				area: area.getAreaInfo({x: player.x, y: player.y}, player.range), 
        curPlayer: player.getInfo(),
				mapData: {
					mapWeight: map.width,
					mapHeight: map.height,
					tileW : map.tileW,
					tileH : map.tileH,
					weightMap: map.weightMap
				}
			}
		});
  });
};

/**
 * Change player's view.
 *
 * @param {Object} msg
 * @param {Object} session
 * @param {Function} next
 * @api public
 */
handler.changeView = function(msg, session, next){
	var playerId = session.playerId;
	var width = msg.width;
	var height = msg.height;

	var radius = width>height ? width : height;

	var range = Math.ceil(radius / 600);
	var player = area.getPlayer(playerId);

	if(range < 0 || !player){
		next(new Error('invalid range or player'), {
      route: msg.route,
			code: consts.MESSAGE.ERR
		});
		return;
	}

	if(player.range !== range){
    timer.updateWatcher({id:player.entityId, type:player.type}, player, player, player.range, range);
		player.range = range;
	}

	next(null, {
    route: msg.route,
		code: consts.MESSAGE.RES
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
  var path = msg.path;
  var playerId = session.playerId;
  var player = area.getPlayer(playerId);
  if(!player){
    logger.error('Move without a valid player ! playerId : %j', playerId);
    next(new Error('invalid player:' + playerId), {
      route: msg.route,
      code: consts.MESSAGE.ERR
    });
		return;
  }

  var speed = player.walkSpeed;

	if(player.died){
		logger.warn('You can not move a died man! player: %j', player);
		next(new Error('fail to move player for the player has died. playerId:' + playerId), {
      route: msg.route,
      code: consts.MESSAGE.ERR
    });
    
		return;
	}

  player.target = null;

  if(!area.map().verifyPath(path)){
    logger.warn('The path is illigle!! The path is: %j', msg.path);
    next(new Error('fail to move for illegal path'), {
      route: msg.route,
      code: consts.MESSAGE.ERR
    });

    return;
  }

	/**
	var startTime = new Date().getTime();
	while(new Date().getTime() < 5 * 1000 + startTime) {

	}
	*/

  var action = new Move({
    entity: player,
    path: path,
    speed: speed
  });

	var ignoreList = {};
	ignoreList[player.userId] = true;
  if (timer.addAction(action)) {
      messageService.pushMessageByAOI({
      route: 'onMove',
      entityId: player.entityId,
      path: path,
      speed: speed
    }, path[0], ignoreList);
    next(null, {
      route: msg.route,
      code: consts.MESSAGE.RES
    });
    next();
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

