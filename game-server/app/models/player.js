var util = require('util');
var Entity = require('./entity');
var dataApi = require('../../util/dataApi');
var EntityType = require('../../consts/consts').EntityType;
var logger = require('pomelo-logger').getLogger(__filename);
var area = require('./area');

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
  this.walkSpeed = 240;

	//this.roleData = dataApi.role.findById(this.kindId);
	// this.range = opts.range || 2;

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
    x: this.x,
    y: this.y,
		walkSpeed: this.walkSpeed,
		areaId: this.areaId
  };
};

