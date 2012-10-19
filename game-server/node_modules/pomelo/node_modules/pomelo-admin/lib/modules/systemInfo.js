/*!
 * Pomelo -- consoleModule systemInfo
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
Module.moduleId = 'systemInfo';

var pro = Module.prototype;

pro.monitorHandler = function(agent, msg, cb) {
	//collect data
	var self = this;
	monitor.sysmonitor.getSysInfo(function (data) {
		agent.notify(Module.moduleId, {serverId: agent.id, body: data});
	});
};

pro.masterHandler = function(agent, msg) {
	if(!msg) {
		agent.notifyAll(Module.moduleId);
		return;
	}

	var body = msg.body;

	var oneData = {
		Time:body.iostat.date,hostname:body.hostname,serverId:msg.serverId,cpu_user:body.iostat.cpu.cpu_user,
		cpu_nice:body.iostat.cpu.cpu_nice,cpu_system:body.iostat.cpu.cpu_system,cpu_iowait:body.iostat.cpu.cpu_iowait,
		cpu_steal:body.iostat.cpu.cpu_steal,cpu_idle:body.iostat.cpu.cpu_idle,tps:body.iostat.disk.tps,
		kb_read:body.iostat.disk.kb_read,kb_wrtn:body.iostat.disk.kb_wrtn,kb_read_per:body.iostat.disk.kb_read_per,
		kb_wrtn_per:body.iostat.disk.kb_wrtn_per,totalmem:body.totalmem,freemem:body.freemem,'free/total':(body.freemem/body.totalmem),
		m_1:body.loadavg[0],m_5:body.loadavg[1],m_15:body.loadavg[2]
	};

	var data = agent.get(Module.moduleId);
	if(!data) {
		data = {};
		agent.set(Module.moduleId, data);
	}

	data[msg.serverId] = oneData;
};

pro.clientHandler = function(agent, msg, cb) {
	utils.invokeCallback(cb, null, agent.get(Module.moduleId) || {});
};
