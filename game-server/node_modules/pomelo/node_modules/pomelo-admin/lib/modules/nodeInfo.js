/*!
 * Pomelo -- consoleModule nodeInfo processInfo
 * Copyright(c) 2012 fantasyni <fantasyni@163.com>
 * MIT Licensed
 */
var monitor = require('pomelo-monitor');
var logger = require('../util/log/log').getLogger(__filename);
var utils = require('../util/utils');

var Module = function(opts) {
	opts = opts || {};
	this.type = opts.type || 'pull';
	this.interval = opts.interval || 5;
};

module.exports = Module;
Module.moduleId = 'nodeInfo';

var pro = Module.prototype;
 
pro.monitorHandler = function(agent, msg, cb) {
	//collect data
	var self = this;
	var serverId = agent.id;
	var pid = process.pid;
	var params = {
		serverId: serverId,
		pid: pid
	};
    monitor.psmonitor.getPsInfo(params, function (data) {
    	agent.notify(Module.moduleId, {serverId: agent.id, body: data});
    });

};

pro.masterHandler = function(agent, msg, cb) {
	if(!msg) {
		agent.notifyAll(Module.moduleId);
		return;
	}

	var body=msg.body;
	var data = agent.get(Module.moduleId);
	if(!data) {
		data = {};
		agent.set(Module.moduleId, data);
	}

	data[msg.serverId] = body;
};

pro.clientHandler = function(agent, msg, cb) {
	utils.invokeCallback(cb, null, agent.get(Module.moduleId) || {});
};
