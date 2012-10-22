// Module dependencies
var EventEmitter = require('events').EventEmitter;
var util = require('util');

var id = 1;

/**
 * Initialize a new 'Entity' with the given 'opts'.
 * Entity inherits EventEmitter
 *
 * @param {Object} opts
 * @api public
 */
function Entity(opts) {
	EventEmitter.call(this);
	this.entityId = id++;
	this.kindId = opts.kindId;
	this.kindName = opts.kindName;
	this.type = opts.type;
	this.x = opts.x;
	this.y = opts.y;
	
	this.areaId = opts.areaId || 1;
}

util.inherits(Entity, EventEmitter);

module.exports = Entity;


/**
 * Get state
 *
 * @return {Object}
 * @api public
 */
Entity.prototype.getPostion = function() {
	return {x: this.x, y: this.y};
};

/**
 * Set positon of this entityId
 *
 * @param {Number} x
 * @param {Number} y
 * @api public
 */
Entity.prototype.setPosition = function(x, y) {
	this.x = x;
	this.y = y;
};



