var Action = require('./action');
var util = require('util');
//var area = require('../area/area');
//var timer = require('../area/timer');
//var consts = require('../../consts/consts');
//var logger = require('pomelo-logger').getLogger(__filename);

/**
 * Move action, which is used to preserve and update user position
 */
var Move = function(opts) {
	opts.type = 'move';
	opts.id = opts.entity.entityId;
	opts.singleton = true;

	Action.call(this, opts);
	this.time = Date.now();
	this.entity = opts.entity;
  this.endPos = opts.endPos;
};

util.inherits(Move, Action);

Move.prototype.update = function() {
	var time = Date.now() - this.time;
  var speed = this.entity.walkSpeed;
  var moveLength = speed * time / 1000;
  var curPos = getPos(this.entity.getPos(), this.endPos, moveLength);
  this.entity.setPos(curPos.x, curPos.y);

  this.time = Date.now();
};

function getDis(pos1, pos2) {
	return Math.sqrt(Math.pow((pos1.x - pos2.x), 2) + Math.pow((pos1.y - pos2.y), 2));
}

function getPos(start, end, dis) {
	var length = getDis(start, end);
	var pos = {};

	pos.x = Math.round(end.x - (end.x - start.x) * (dis / length));
	pos.y = Math.round(end.y - (end.y - start.y) * (dis / length));

	return pos;
}

module.exports = Move;
