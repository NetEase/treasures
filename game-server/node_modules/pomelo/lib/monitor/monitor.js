/**
 * Component for monitor.
 * Load and start monitor client.
 */
var logger = require('../util/log/log').getLogger(__filename);
var admin = require('pomelo-admin');
var Starter = require('../modules/starter');
var utils = require('../util/utils');

var Monitor = function(app) {
	this.app = app;
	this.server = app.curserver;
	this.master = app.master;

	this._loadModules();
};

module.exports = Monitor;

var pro = Monitor.prototype;

pro.start = function(cb) {
	this.monitorConsole.start(cb);
};

pro.stop = function(cb) {
	this.monitorConsole.stop();
	process.nextTick(function() {
		utils.invokeCallback(cb);
	});
};

pro._loadModules = function() {
	this.monitorConsole = admin.createMonitorConsole({
		id: this.server.id, 
		type: this.app.serverType, 
		host: this.master.host, 
		port: this.master.port
	});

	this.monitorConsole.register(Starter.moduleId, new Starter(this.app));

	// TODO: load admin.modules automatically
	var SystemInfo = admin.modules.systemInfo;
	this.monitorConsole.register(SystemInfo.moduleId, new SystemInfo());

	var NodeInfo = admin.modules.nodeInfo;
	this.monitorConsole.register(NodeInfo.moduleId, new NodeInfo());

	//var SceneInfo = admin.modules.sceneInfo;
	//this.monitorConsole.register(SceneInfo.moduleId, new SceneInfo());

	var MonitorLog = admin.modules.monitorLog;
	this.monitorConsole.register(MonitorLog.moduleId, new MonitorLog());

	//var OnlineUser = admin.modules.onlineUser;
	//this.monitorConsole.register(OnlineUser.moduleId, new OnlineUser(this.app));

	var Scripts = admin.modules.scripts;
	this.monitorConsole.register(Scripts.moduleId, new Scripts(this.app));

	var Profiler = admin.modules.profiler;
	this.monitorConsole.register(Profiler.moduleId, new Profiler(this.app));

	var ServerStop = admin.modules.serverStop;
	this.monitorConsole.register(ServerStop.moduleId, new ServerStop(this.app));

	var _modules = this.app.modules;
	for(var _module in _modules){
		var fun = _modules[_module].module;
		if(_modules[_module].requireApp){
			this.monitorConsole.register(_module,new fun(this.app));	
		}else{
			this.monitorConsole.register(_module,new fun());
		}
	}
};