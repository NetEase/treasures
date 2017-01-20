var logger = require('pomelo-logger').getLogger('bearcat-treasures', 'AreaService');
var EventEmitter = require('events').EventEmitter;
var bearcat = require('bearcat');
var pomelo = require('pomelo');

var AreaService = function() {
  this.id = 0;
  this.width = 0;
  this.height = 0;
  this.tickCount = 0; // player score rank
  this.treasureCount = 0;
  this.added = []; // the added entities in one tick
  this.reduced = []; // the reduced entities in one tick
  this.players = {};
  this.entities = {};
  this.channel = null;
  this.actionManagerService = null;
  this.consts = null;
}

/**
 * Init areas
 * @param {Object} opts
 * @api public
 */
AreaService.prototype.init = function(opts) {
  this.id = opts.id;
  this.width = opts.width;
  this.height = opts.height;

  this.generateTreasures(40);

  //area run
  this.run();
};

AreaService.prototype.run = function() {
  setInterval(this.tick.bind(this), 100);
}

AreaService.prototype.tick = function() {
  //run all the action
  this.actionManagerService.update();
  this.entityUpdate();
  this.rankUpdate();
}

AreaService.prototype.addAction = function(action) {
  return this.actionManager().addAction(action);
}

AreaService.prototype.abortAction = function(type, id) {
  return this.actionManager().abortAction(type, id);
}

AreaService.prototype.abortAllAction = function(id) {
  return this.actionManager().abortAllAction(id);
}

AreaService.prototype.getChannel = function() {
  if (this.channel) {
    return this.channel;
  }

  this.channel = pomelo.app.get('channelService').getChannel('area_' + this.id, true);
  return this.channel;
};

AreaService.prototype.addEvent = function(player) {
  var self = this;
  player.on('pickItem', function(args) {
    var player = self.getEntity(args.entityId);
    var treasure = self.getEntity(args.target);
    player.target = null;
    if (treasure) {
      player.addScore(treasure.score);
      self.removeEntity(args.target);
      self.getChannel().pushMessage({
        route: 'onPickItem',
        entityId: args.entityId,
        target: args.target,
        score: treasure.score
      });
    }
  });
}

AreaService.prototype.entityUpdate = function() {
  if (this.reduced.length > 0) {
    this.getChannel().pushMessage({
      route: 'removeEntities',
      entities: this.reduced
    });
    this.reduced = [];
  }
  if (this.added.length > 0) {
    var added = this.added;
    var r = [];
    for (var i = 0; i < added.length; i++) {
      r.push(added[i].toJSON());
    }

    this.getChannel().pushMessage({
      route: 'addEntities',
      entities: r
    });
    this.added = [];
  }
};
/**
 * Add entity to area
 * @param {Object} e Entity to add to the area.
 */
AreaService.prototype.addEntity = function(e) {
  if (!e || !e.entityId) {
    return false;
  }

  this.entities[e.entityId] = e;

  if (e.type === this.consts.EntityType.PLAYER) {
    this.getChannel().add(e.id, e.serverId);
    this.addEvent(e);

    if (!!this.players[e.id]) {
      logger.error('add player twice! player : %j', e);
    }
    this.players[e.id] = e.entityId;
  } else if (e.type === this.consts.EntityType.TREASURE) {
    this.treasureCount++;
  }

  this.added.push(e);
  return true;
};


AreaService.prototype.rankUpdate = function() {
  this.tickCount++;
  if (this.tickCount >= 10) {
    this.tickCount = 0;
    var player = this.getAllPlayers();
    player.sort(function(a, b) {
      return a.score < b.score;
    });
    var ids = player.slice(0, 10).map(function(a) {
      return a.entityId;
    });
    this.getChannel().pushMessage({
      route: 'rankUpdate',
      entities: ids
    });
  }
};

/**
 * Remove Entity form area
 * @param {Number} entityId The entityId to remove
 * @return {boolean} remove result
 */
AreaService.prototype.removeEntity = function(entityId) {
  var e = this.entities[entityId];
  if (!e) {
    return true;
  }

  if (e.type === this.consts.EntityType.PLAYER) {
    this.getChannel().leave(e.id, e.serverId);
    this.actionManagerService.abortAllAction(entityId);

    delete this.players[e.id];
  } else if (e.type === this.consts.EntityType.TREASURE) {
    this.treasureCount--;
    if (this.treasureCount < 25) {
      this.generateTreasures(15);
    }
  }

  delete this.entities[entityId];
  this.reduced.push(entityId);
  return true;
};

/**
 * Get entity from area
 * @param {Number} entityId.
 */
AreaService.prototype.getEntity = function(entityId) {
  return this.entities[entityId];
};

/**
 * Get entities by given id list
 * @param {Array} The given entities' list.
 */
AreaService.prototype.getEntities = function(ids) {
  var result = [];
  for (var i = 0; i < ids.length; i++) {
    var entity = this.entities[ids[i]];
    if (entity) {
      result.push(entity);
    }
  }

  return result;
};

AreaService.prototype.getAllPlayers = function() {
  var _players = [];
  var players = this.players;
  for (var id in players) {
    _players.push(this.entities[players[id]]);
  }

  return _players;
};

AreaService.prototype.generateTreasures = function(n) {
  if (!n) {
    return;
  }
  for (var i = 0; i < n; i++) {
    var d = this.dataApiUtil.treasure().random();
    var t = bearcat.getBean('treasure', {
      kindId: d.id,
      kindName: d.name,
      imgId: d.imgId,
      score: parseInt(d.heroLevel, 10)
    });

    this.addEntity(t);
  }
};

AreaService.prototype.getAllEntities = function() {
  var r = {};
  var entities = this.entities;

  for (var id in entities) {
    r[id] = entities[id].toJSON();
  }

  return r;
  // return this.entities;
};

AreaService.prototype.getPlayer = function(playerId) {
  var entityId = this.players[playerId];
  return this.entities[entityId];
};

AreaService.prototype.removePlayer = function(playerId) {
  var entityId = this.players[playerId];

  if (entityId) {
    delete this.players[playerId];
    this.removeEntity(entityId);
  }
};

/**
 * Get area entities for given postion and range.
 */
AreaService.prototype.getAreaInfo = function() {
  var entities = this.getAllEntities();
  return {
    id: this.id,
    entities: entities,
    width: this.width,
    height: this.height
  };
};

AreaService.prototype.getWidth = function() {
  return this.width;
};

AreaService.prototype.getHeight = function() {
  return this.height;
};

AreaService.prototype.entities = function() {
  return this.entities;
};

AreaService.prototype.actionManager = function() {
  return this.actionManagerService;
};

module.exports = {
  id: "areaService",
  func: AreaService,
  props: [{
    name: "actionManagerService",
    ref: "actionManagerService"
  }, {
    name: "dataApiUtil",
    ref: "dataApiUtil"
  }, {
    name: "consts",
    ref: "consts"
  }]
}