var pomelo = require('../pomelo');
var starter = require('../master/starter');
var logger = require('../util/log/log').getLogger(__filename);
var express = require('express');
var exec = require("child_process").exec;
var utils = require('../util/utils');
var admin = require('pomelo-admin');
var Starter = require('../modules/starter');
var TIME_WAIT_KILL = 5000;
var crashLogger = require('../util/log/log').getLogger('crash-log');
var util = require('util');
/**
 * master server
 */
var server = {};//module.exports;
var dserver;
var handler = {};

var Server = function(app) {
	this.app = app;
	this.server = app.master;
	this.registered = {};

	this.masterConsole = admin.createMasterConsole({
		port: this.server.port
	});

	// TODO: load admin.modules automatically
	var SystemInfo = admin.modules.systemInfo;
	this.masterConsole.register(SystemInfo.moduleId, new SystemInfo());

	var NodeInfo = admin.modules.nodeInfo;
	this.masterConsole.register(NodeInfo.moduleId, new NodeInfo());

	var MonitorLog = admin.modules.monitorLog;
	this.masterConsole.register(MonitorLog.moduleId, new MonitorLog());

	var Scripts = admin.modules.scripts;
	this.masterConsole.register(Scripts.moduleId, new Scripts(app));

	var Profiler = admin.modules.profiler;
	this.masterConsole.register(Profiler.moduleId, new Profiler(app, true, this.masterConsole.agent));

	var ServerStop = admin.modules.serverStop;
	this.masterConsole.register(ServerStop.moduleId, new ServerStop(app));

	//var SceneInfo = admin.modules.sceneInfo;
	//this.masterConsole.register(SceneInfo.moduleId, new SceneInfo());

	//var OnlineUser = admin.modules.onlineUser;
	//this.masterConsole.register(OnlineUser.moduleId, new OnlineUser(app));

	// load app register modules 
	//logger.error(app.modules);
	var _modules = app.modules;
	for(var _module in _modules){
		var fun = _modules[_module].module;
		if(_modules[_module].requireApp){
			this.masterConsole.register(_module,new fun(app));	
		}else{
			this.masterConsole.register(_module,new fun());
		}
	}
};

module.exports = Server;

var pro = Server.prototype;

pro.start = function(cb) {
	var self = this;
	this.masterConsole.start(function(err) {
		if(err) {
			utils.invokeCallback(cb, err);
			return;
		}
		runServers(self.app);
		utils.invokeCallback(cb);
	});
	
	this.masterConsole.on('register', function(record) {
		logger.debug('[master] new register connection: %j, %j', record.id, record.type);
		self.registered[record.id] = record;
		if(checkRegistered(self)) {
			logger.info('[master] all servers have started and notify after start now...');
			self.masterConsole.agent.notifyAll(Starter.moduleId);
			startQueryServer(self.server.queryPort);
		}
	});
	this.masterConsole.on('disconnect', function(id,type,reason) {
		crashLogger.info(util.format('[%s],[%s],[%s],[%s]',type,id,Date.now(),reason | 'disconnect'));
	});
};

pro.stop = function(cb) {
	this.masterConsole.stop(cb);
};

var checkRegistered = function(master) {
	var servers = master.app.servers, slist, i, l;
	for(var stype in servers) {
		slist = servers[stype];
		for(i=0, l=slist.length; i<l; i++) {
			if(!master.registered[slist[i].id]) {
				return false;
			}
		}
	}
	return true;
};

var startQueryServer = function(port) {
	var app = express.createServer();
	app.use(app.router);
	app.configure('development', function () {
		app.use(express.errorHandler({ dumpExceptions:true, showStack:true }));
	});

	app.configure('production', function () {
		app.use(express.errorHandler());
	});

	var self = this;

	// Routes
	app.get('/', function (req, res) {
		res.writeHeader(200, {
			'content-type':'text/javascript'
			});
		res.end('window.__front_address__=\'localhost:3050\';');
	});

	app.get('/status', function (req, res) {
		res.writeHeader(200, {
			'content-type':'text/plain'
			});
		res.end(JSON.stringify(self.serverAgent.getStatus()));
	});

	app.listen(port);
};

handler.pushStatus = function (serverType, serverId) {
	logger.info(' report status serverType: ' + serverType + ' serverId: ' + serverId);
};

/**
 * Start query server
 *   The server return the lowest load server and assigned to window.
 *
 */
server.startQueryServer = function (port) {
	var app = express.createServer();
	app.use(app.router);
	app.configure('development', function () {
		app.use(express.errorHandler({ dumpExceptions:true, showStack:true }));
	});

	app.configure('production', function () {
		app.use(express.errorHandler());
	});

	var self = this;

	// Routes
	app.get('/', function (req, res) {
		res.writeHeader(200, {
			'content-type':'text/javascript'
			});
		res.end('window.__front_address__=\'' + self.serverAgent.getLowLoadServer() + '\';');
	});

	app.get('/status', function (req, res) {
		res.writeHeader(200, {
			'content-type':'text/plain'
			});
		res.end(JSON.stringify(self.serverAgent.getStatus()));
	});

	app.listen(port);
};

/**
 * Start command Server
 *  Listen to command from command line:
 *  - pomelo list
 *  - pomelo kill
 *  - pomelo stop
 *
 */
function startCommandServer() {
	var app = pomelo.app;
	var serverAgent = app.get('serverAgent');
	var nodes = serverAgent.nodes;
	var servers = [];

	function getNodeInfo(app) {
		var processInfo = [];
		for (var nodeId in nodes) {
			var node = nodes[nodeId];
			processInfo.push(node.info.processInfo);
		}
		return processInfo;
	}

	serverAgent.io.sockets.on('connection', function (socket) {
		//list signal
		socket.on('list', function (data) {
			var rs = 'serverId            serverType       pid      cpuAvg     memAvg        time  \n';
			var processInfo = getNodeInfo(app);
			for (var i = 0; i < processInfo.length; i++) {
				if (processInfo[i] === undefined) {
					continue;
				}
				var obj = JSON.stringify(processInfo[i]);
				var js = JSON.parse(obj);
				rs += js.serverId + '    ' + js.serverType + '    ' + js.pid + '    ' + js.cpuAvg + '     ' + js.memAvg + '       ' + js.time + '\n';
			}
			socket.emit('info', {info:rs});
		});

		//kill signal
		socket.on('kill', function (data) {
			setTimeout(function () {
				var pid = [];
				var serverId = [];
				var processInfo = getNodeInfo(app);
				for (var i = 0; i < processInfo.length; i++) {
					if (processInfo[i] === undefined) {
						continue;
					}
					var obj = JSON.stringify(processInfo[i]);
					var js = JSON.parse(obj);
					pid.push(js.pid);
					serverId.push(js.serverId);
				}
				app.kill(pid, serverId);
			}, TIME_WAIT_KILL);
		});
		//stop signal
		socket.on('stop', function (data) {
			app.stop(false, function () {
				for (var nodeId in nodes) {
					if (nodeId !== 'master-server-1') {
						nodes[nodeId].socket.emit('stop_node');
					}
					servers.push(nodeId);
				}
			});
		});

		//stop callback
		socket.on('stop_back', function (data) {
			utils.removeElement(data.id, servers);
			if (servers.length === 1 && servers[0] === 'master-server-1') {
				nodes['master-server-1'].socket.emit('stop_node');
			}
		});
	});
}

/**
 * Run all servers
 *
 * @param {Object} app current application  context
 * @return {Void}
 */
var runServers = function (app) {
	var servers = app.servers;
	for (var serverType in servers) {
		var typeServers = servers[serverType];
		for (var i = 0; i < typeServers.length; i++) {
			var curServer = typeServers[i];
			curServer.serverType = serverType;
			starter.run(app, curServer);
		}
	}
};

