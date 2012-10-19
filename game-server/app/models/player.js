var util = require('util');
var Entity = require('./entity');
var dataApi = require('../../util/dataApi');
var EntityType = require('../../consts/consts').EntityType;
var logger = require('pomelo-logger').getLogger(__filename);
var area = require('./../area/area');

/**
 * Initialize a new 'Player' with the given 'opts'.
 * Player inherits Character
 *
 * @param {Object} opts
 * @api public
 */

function Player(opts) {
	this.id = opts.id;
	this.type = EntityType.PLAYER;
	this.name = opts.name;

	this.roleData = dataApi.role.findById(this.kindId);
	this.range = opts.range || 2;

}

util.inherits(Player, Entity);

module.exports = Player;


/**
 * Pick item.
 * It exists some results: NOT_IN_RANGE, VANISH, BAG_FULL, SUCCESS
 *
 * @param {Number} entityId
 * @return {Object}
 * @api public
 */

Player.prototype.pickItem = function(entityId) {
	var item = area.getEntity(entityId);
	
  var result = {player : this, item : item}
  
  if(!item) {
    result.result = consts.Pick.VANISH;
    this.emit('pickItem', result);
    return result;
  }

  // TODO: remove magic pick distance 200
  if(!formula.inRange(this, item, 200)) {
    result.distance = 200;
    result.result = consts.Pick.NOT_IN_RANGE;
    this.emit('pickItem', result);
    return result;
  }

	if(!this.bag.addItem({id: item.kindId, type: item.type})) {
		result.result = consts.Pick.BAG_FULL;
		this.emit('pickItem', result);
    return result;
  }
  
	
	result.result = consts.Pick.SUCCESS;
	this.emit('pickItem', result);
	return result;
};



//Convert player' state to json and return
Player.prototype.strip = function() {
	return {
		id: this.id,
		entityId: this.entityId,
		name: this.name,
		kindId: this.kindId,
		kindName: this.kindName,
		type: this.type,
		x: this.x,
		y: this.y,
		hp: this.hp,
		mp: this.mp,
		maxHp: this.maxHp,
		maxMp: this.maxMp,
		//country: this.country,
		//rank: this.rank,
		level: this.level,
		experience: this.experience,
		attackValue: this.attackValue,
		defenceValue: this.defenceValue,
		walkSpeed: this.walkSpeed,
		attackSpeed: this.attackSpeed,
		areaId: this.areaId,
		hitRate: this.hitRate,
		dodgeRate: this.dodgeRate,
		//gender: this.gender,
		//career: this.career,
		nextLevelExp: this.nextLevelExp,
		skillPoint: this.skillPoint
	};
};

/**
 * Get the whole information of player, contains tasks, bag, equipments information.
 * 
 *  @return {Object}
 *  @api public
 */
Player.prototype.getInfo = function() {
	var playerData = this.strip();
	playerData.bag = this.bag;
	playerData.equipments = this.equipments;
	playerData.characterData = this.characterData;
	playerData.fightSkills = this.fightSkills;
	playerData.curTasks = this._getCurTasksInfo();
	return playerData;
};


/**
 * Parse String to json.
 * It covers object' method
 *
 * @param {String} data
 * @return {Object}
 * @api public
 */

Player.prototype.toJSON = function() {
  return {
    id: this.id,
    entityId: this.entityId,
    name: this.name,
    kindId: this.kindId,
    kindName: this.kindName,
    type: this.type,
    x: this.x,
    y: this.y,
    hp: this.hp,
    mp: this.mp,
    maxHp: this.maxHp,
    maxMp: this.maxMp,
		level: this.level,
		walkSpeed: this.walkSpeed,
		areaId: this.areaId
  };
};

