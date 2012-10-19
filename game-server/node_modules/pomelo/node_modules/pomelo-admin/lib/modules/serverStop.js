/*!
 * Pomelo -- consoleModule serverStop stop/kill
 * Copyright(c) 2012 fantasyni <fantasyni@163.com>
 * MIT Licensed
 */
var monitor = require('pomelo-monitor');
var logger = require('../util/log/log').getLogger(__filename);
var utils = require('../util/utils');

var TIME_WAIT_KILL = 5000;

var Module = function(app,opts) {
	opts = opts || {};
	this.app = app;
	this.type = opts.type || 'pull';
	this.interval = opts.interval || 5;
};

module.exports = Module;
Module.moduleId = 'serverStop';

var pro = Module.prototype;

pro.monitorHandler = function(agent, msg, cb) {
	this.app.stop(false);
};

pro.masterHandler = function(agent, msg) {
	
};

pro.clientHandler = function(agent, msg, cb) {
	var self = this;
	logger.error(msg);
	if(msg.signal === 'kill'){
		if(!msg.pid.length || !msg.serverId.length){
			utils.invokeCallback(cb, null, {status : "server kill not ok,try again"});
			return;
		}
		setTimeout(function(){
			self.app.kill(msg.pid, msg.serverId);
			utils.invokeCallback(cb, null, {status : "server kill ok"});
		}, TIME_WAIT_KILL);
	}else if(msg.signal === 'stop'){
		agent.notifyAll(Module.moduleId);
		self.app.stop(false);
		utils.invokeCallback(cb, null, {status : "server stop ok"});
	}
};
