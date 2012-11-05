var util = require('util');
var Entity = require('./entity');
var dataApi = require('../util/dataApi');
var EntityType = require('../consts/consts').EntityType;
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
  Entity.call(this, opts);
	this.id = opts.id;
	this.type = EntityType.PLAYER;
	this.name = opts.name;
  this.walkSpeed = 240;
  this.treasureCount = opts.treasureCount || 0;
  this.target = null;
}

util.inherits(Player, Entity);

module.exports = Player;

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
    type: this.type,
    x: this.x,
    y: this.y,
		walkSpeed: this.walkSpeed,
		areaId: this.areaId
  };
};

