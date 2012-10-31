// Module dependencies
var EventEmitter = require('events').EventEmitter;
var util = require('util');
var dataApi = require('../util/dataApi');
var utils = require('../util/utils');

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
	this.areaId = opts.areaId || 1;

  if (opts.x === undefined || opts.y === undefined) {
    this.randPos();
  } else {
    this.x = opts.x;
    this.y = opts.y;
  }
	
}

util.inherits(Entity, EventEmitter);

module.exports = Entity;

// random position
Entity.prototype.randPos = function() {
  var area = dataApi.area.findById(this.areaId);
  this.x = utils.rand(20, area.width - 20);
  this.y = utils.rand(20, area.height - 20);
};

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



