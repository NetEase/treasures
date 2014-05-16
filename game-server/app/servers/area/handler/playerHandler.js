var logger = require('pomelo-logger').getLogger('bearcat-treasures', 'PlayerHandler');
var bearcat = require('bearcat');
var fs = require('fs');

var PlayerHandler = function(app) {
  this.app = app;
  this.areaService = null;
  this.consts = null;
};

/**
 * Player enter scene, and response the related information such as
 * playerInfo, areaInfo and mapData to client.
 *
 * @param {Object} msg
 * @param {Object} session
 * @param {Function} next
 * @api public
 */
PlayerHandler.prototype.enterScene = function(msg, session, next) {
  var role = this.dataApiUtil.role().random();
  var player = bearcat.getBean('player', {
    id: msg.playerId,
    name: msg.name,
    kindId: role.id
  });

  player.serverId = session.frontendId;
  if (!this.areaService.addEntity(player)) {
    logger.error("Add player to area faild! areaId : " + player.areaId);
    next(new Error('fail to add user into area'), {
      route: msg.route,
      code: this.consts.MESSAGE.ERR
    });
    return;
  }

  var r = {
    code: this.consts.MESSAGE.RES,
    data: {
      area: this.areaService.getAreaInfo(),
      playerId: player.id
    }
  };

  next(null, r);
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
PlayerHandler.prototype.getAnimation = function(msg, session, next) {
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
    code: this.consts.MESSAGE.RES,
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
PlayerHandler.prototype.move = function(msg, session, next) {
  var endPos = msg.targetPos;
  var playerId = session.get('playerId');
  var player = this.areaService.getPlayer(playerId);
  if (!player) {
    logger.error('Move without a valid player ! playerId : %j', playerId);
    next(new Error('invalid player:' + playerId), {
      code: this.consts.MESSAGE.ERR
    });
    return;
  }

  var target = this.areaService.getEntity(msg.target);
  player.target = target ? target.entityId : null;

  if (endPos.x > this.areaService.getWidth() || endPos.y > this.areaService.getHeight()) {
    logger.warn('The path is illigle!! The path is: %j', msg.path);
    next(new Error('fail to move for illegal path'), {
      code: this.consts.MESSAGE.ERR
    });

    return;
  }

  var action = bearcat.getBean('move', {
    entity: player,
    endPos: endPos,
  });

  if (this.areaService.addAction(action)) {
    next(null, {
      code: this.consts.MESSAGE.RES,
      sPos: player.getPos()
    });

    this.areaService.getChannel().pushMessage({
      route: 'onMove',
      entityId: player.entityId,
      endPos: endPos
    });
  }
};

module.exports = function(app) {
  return bearcat.getBean({
    id: "playerHandler",
    func: PlayerHandler,
    args: [{
      name: "app",
      value: app
    }],
    props: [{
      name: "areaService",
      ref: "areaService"
    }, {
      name: "dataApiUtil",
      ref: "dataApiUtil"
    }, {
      name: "consts",
      ref: "consts"
    }]
  });
};