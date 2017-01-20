var bearcat = require('bearcat');
var util = require('util');

/**
 * Initialize a new 'Treasure' with the given 'opts'.
 * Item inherits Entity
 *
 * @param {Object} opts
 * @api public
 */

function Treasure(opts) {
	this.opts = opts;
	this.type = null;
	this.imgId = opts.imgId;
	this.score = opts.score || 0;
	this.consts = null;
}

Treasure.prototype.init = function() {
	this.type = this.consts.EntityType.TREASURE;
	var Entity = bearcat.getFunction('entity');
	Entity.call(this, this.opts);
	this._init();
}

Treasure.prototype.toJSON = function() {
	var r = this._toJSON();
	r['type'] = this.type;
	r['imgId'] = this.imgId;
	r['score'] = this.score;

	return r;
}

module.exports = {
	id: "treasure",
	func: Treasure,
	scope: "prototype",
	parent: "entity",
	init: "init",
	args: [{
		name: "opts",
		type: "Object"
	}],
	props: [{
		name: "consts",
		ref: "consts"
	}]
};