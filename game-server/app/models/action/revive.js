var Action = require('./action');
var area = require('../area/area');
var messageService = require('../messageService');
var util = require('util');
var consts = require('../../consts/consts');
var logger = require('pomelo-logger').getLogger(__filename);

var Revive = function(opts){
	opts.type = 'revive';
	opts.id = opts.entity.entityId;
	opts.singleton = true;

	Action.call(this, opts);
	this.entity = opts.entity;
	this.time = opts.reviveTime;
	this.now = Date.now();
};

util.inherits(Revive, Action);

/**
 * Update revive time
 * @api public
 */
Revive.prototype.update = function(){
	var time = Date.now();
	
	this.time -= time - this.now;
	if(this.time <= 10){
		this.entity.died = false;
		this.entity.hp = this.entity.maxHp/2;
    messageService.pushMessage({route: 'onRevive', entityId : this.entity.entityId, x: this.entity.x, y: this.entity.y, hp: this.entity.hp});
		this.finished = true;	
	}
	this.now = time;
};


module.exports = Revive;
