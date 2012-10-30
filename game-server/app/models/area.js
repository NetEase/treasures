var EventEmitter = require('events').EventEmitter;
var dataApi = require('../util/dataApi');
//var Map = require('./../map/map');
var pomelo = require('pomelo');
var channelService = pomelo.channelService;
var ActionManager = require('./action/actionManager');
//var Queue = require('pomelo-collection').queue;
//var eventManager = require('./../event/eventManager');
var timer = require('./timer');
var EntityType = require('../consts/consts').EntityType;
var logger = require('pomelo-logger').getLogger(__filename);

var exp = module.exports;

var id = 0;
var width = 0;
var height = 0;

var actionManager = null;
// var aiManager = null;
// var patrolManager = null;

//The map from player to entity
var players = {};

var entities = {};

// var zones = {};

var items = {};

var channel = null;

// var aoi = null;

/**
 * Init areas
 * @param {Object} opts
 * @api public
 */
exp.init = function(opts){
	//Init Map
	id = opts.id;
  width = opts.width;
  height = opts.height;

	// opts.weightMap = true;
	// map = new Map(opts);
	//Init AOI
  //aoi = aoiManager.getService(aoiConfig[id]);
	// aoiEventManager.addEvent(aoi.aoi);

	//Init mob zones
	// initMobZones(map.getMobZones());

	// initNPCs(this);

	//create local channel
	channel = channelService.getLocalChannelSync({name:'area_' + id, create:true});

	// aiManager = ai.createManager();

	// patrolManager = patrol.createManager({area:this});

	actionManager = new ActionManager();

	run();
};

// area run
function run() {
  timer.run();
}

function addEvent(player) {
  player.on('pickItem', function(args){
    if(args.result != consts.Pick.SUCCESS){
      logger.warn('Pick Item error! Result : ' + args.result)
      return;
    }

    var item = args.item;
    var player = args.player;

    area.removeEntity(item.entityId);
    channel.pushMessage({route: 'onPickItem', player: player.entityId, item: item.entityId, x: item.x, y: item.y})
  });
}
/**
 * Add entity to area
 * @param {Object} e Entity to add to the area.
 */
exp.addEntity = function(e) {
  if (!e || !e.entityId) {
    return false;
  }

  entities[e.entityId] = e;
  eventManager.addEvent(e);
  
  if(e.type === EntityType.PLAYER){
		channel.add(e.playerId, e.serverId);
		// aiManager.addCharacters([e]);
		
		// aoi.addWatcher({id: e.entityId, type: e.type}, {x : e.x, y: e.y}, e.range);
		
		if(!!players[e.id]){
			logger.error('add player twice! player : %j', e);
		}
		players[e.id] = e.entityId;
	}else if(e.type === EntityType.ITEM){
		items[e.entityId] = e.entityId;
	}else if(e.type === EntityType.EQUIPMENT){
		items[e.entityId] = e.entityId;
	}

	// aoi.addObject({id:e.entityId, type:e.type}, {x: e.x, y: e.y});
	return true;
};

/**
 * Remove Entity form area
 * @param {Number} entityId The entityId to remove
 * @return {boolean} remove result
 */
exp.removeEntity = function(entityId) {
	var e = entities[entityId];
	if(!e) {
		return true;
  }

	//If the entity is a player, remove it
	if(e.type === 'player') {
		channel.leave(e.playerId, e.serverId);
		actionManager.abortAllAction(entityId);
			
    delete players[e.id];
  }else if(e.type === EntityType.ITEM){
		delete items[entityId];
	}else if(e.type === EntityType.EQUIPMENT){
		delete items[entityId];
	}

  delete entities[entityId];
  return true;
};

/**
 * Get entity from area
 * @param {Number} entityId.
 */
exp.getEntity = function(entityId){
	var entity = entities[entityId];
  if (!entity) {
		return null;
	}
  return entity;
};

/**
 * Get entities by given id list
 * @param {Array} The given entities' list.
 */
exp.getEntities = function(ids){
	var result = [];
	for (var i = 0; i < ids.length; i++) {
		var entity = entities[ids[i]];
		if(!!entity)
			result.push(entity);
	}
	
	return result;
};

exp.getAllPlayers = function(){
	var _players = [];
	for(var id in players){
		_players.push(entities[players[id]]);
	}	
	
	return _players;
}

exp.getAllEntities = function() {
	return entities;
};

exp.getPlayer = function(playerId){
	var entityId = players[playerId];

	if(!!entityId) {
		return entities[entityId];
  }
  
	return null;
};

exp.removePlayer = function(playerId){
	var entityId = players[playerId];

	if(!!entityId){
		delete players[playerId];
		this.removeEntity(entityId);
	}
};

/**
 * Get area entities for given postion and range.
 * @param {Object} pos Given position, like {10,20}.
 * @param {Number} range The range of the view, is the circle radius.
 */
exp.getAreaInfo = function() {
	var entities = this.getAllEntities();
	return {
		id: id,
		entities : entities,
    width: width,
    height: height
	};
};

exp.channel = function (){
	return channel;
};

exp.entities = function (){
	return entities;
};

exp.items = function(){
	return items;
};

exp.actionManager = function(){
	return actionManager;
};


exp.timer = function(){
	return timer;
};


