/*!
 * Pomelo -- proto
 * Copyright(c) 2012 xiechengchao <xiecc@163.com>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */
var fs = require('fs');
var filterManager = require('./filterManager');
var utils = require('./util/utils');
var starter = require('./master/starter');
var logger = require('./util/log/log').getLogger(__filename);
var async = require('async');

/**
 * Application prototype.
 */
var app = module.exports = {};

/**
 * Application states
 */
var STATE_INITED  = 1;  // app has inited
var STATE_STARTED = 2;  // app has started
var STATE_STOPED  = 3;  // app has stoped

/**
 * Initialize the server.
 *
 *   - setup default configuration
 *   - setup default middleware
 *   - setup route reflection methods
 *
 * @api private
 */
app.init = function(){
	logger.info('app.init invoked');
	this.loaded = [];
	this.components = {};
	this.settings = {};
	this.routes = {};
	this.state = STATE_INITED;
	this.modules = {};
};

/**
 * Initialize application configuration.
 *
 * @api private
 */
app.defaultConfiguration = function () {
	// default settings
	this.set('env', process.env.NODE_ENV || 'development');
	this.set('filterManager', filterManager);
	this.set('channelService', require('./common/service/channelService'));
	this.loadConfig('servers', app.get('dirname') + '/config/servers.json');
	this.loadConfig('master', app.get('dirname') + '/config/master.json');
	this.loadConfig('logger', app.get('dirname') + '/config/log4js.json');
	this.processArgs();
};

/**
 * add a filter to before and after filter
 *
 * @param filter {Object} provide before and after filter method. {before: function, after: function}
 */
app.filter = function (filter) {
	filterManager.before(filter);
	filterManager.after(filter);
};

/**
 * add before filter
 *
 * @param bf {Object|Function}
 */
app.before = function (bf) {
	filterManager.before(bf);
};

app.after = function (fn) {
	filterManager.after(fn);
};

/**
 * Load component
 *
 * param  {String} name      (optional) name of the component
 * param  {Object} component component instance or factory function of the component
 * param  {[type]} opts      (optional) construct parameters for the factory function
 * return {Object}           app instance for chain invoke
 */
app.load = function(name, component, opts) {
	if(typeof name !== 'string') {
		opts = component;
		component = name;
		name = null;
		if(typeof component.name === 'string') {
			name = component.name;
		}
	}

	if(typeof component === 'function') {
		component = component(app, opts);
	}

	if(!component) {
		// maybe some component no need to join the components management
		logger.info('load empty component');
		return this;
	}

	if(!name && typeof component.name === 'string') {
		name = component.name;
	}

	if(name && this.components[name]) {
		// ignore duplicat component
		logger.warn('ignore duplicate component: %j', name);
		return;
	}

	this.loaded.push(component);
	if(name) {
		// components with a name would get by name throught app.components later.
		this.components[name] = component;
	}

	return this;
};

/**
 * Set the route function for the specified server type.
 * 
 * @param  {String} serverType server type string
 * @param  {Function} routeFunc  route function. routeFunc(session, msg, servers, cb)
 * @return {Object}            current application instance for chain invoking
 */
app.route = function(serverType, routeFunc) {
	this.routes[serverType] = routeFunc;
	return this;
};

/**
 * Process server start command
 *
 * @return {Void}
 *
 * @api private
 */
app.processArgs = function(){
	var hm = {};
	var args = process.argv;
	var main_position = 1;

	while(args[main_position].indexOf('--')>0){
		main_position++;   
	}        

	for (var i = (main_position+1); i < args.length; i++) {
		var str = args[i].split('=');
		hm[str[0]] = str[1];
	}

	var env = hm.env || 'development';
	var serverType = hm.serverType || 'master';
	var serverId = hm.serverId || this.master.id;

	this.set('main', args[main_position]);
	this.set('env', env);
	this.set('serverType', serverType);
	this.set('serverId', serverId);
	if(serverType !== 'master') {
		this.set('server', app.findServer(serverType, serverId));
	}
	logger.info('application inited: %j', this.serverId);
};

/**
 * Load default components for application.
 * 
 * @return {Void}
 *
 * @api private
 */
app.loadDefaultComponents = function(){
	var pomelo = require('./pomelo');
	// load system default components
	if (this.serverType === 'master') {
		app.load(pomelo.master);
	} else {
		app.load(pomelo.proxy, app.get('proxyConfig'));
		app.load(pomelo.remote, app.get('remoteConfig'));
		app.load(pomelo.handler);
		if(app.isFrontend()) {
			app.load(pomelo.connection);
		}
		app.load(pomelo.server);
	}
	app.load(pomelo.monitor);
	app.load(pomelo.logger);
};

/**
 * Start components.
 *
 * @param  {Function} cb
 * @return {Void}
 */
app.start = function(cb) {
	if(this.state > STATE_INITED) {
		utils.invokeCallback(cb, new Error('application has already start.'));
		return;
	}
	this.loadDefaultComponents();
	var self = this;
	this._optComponents('start', function(err) {
		self.state = STATE_STARTED;
		utils.invokeCallback(cb, err);
	});
};

/**
 * Lifecycle callback for after start.
 *
 * @param  {Function} cb
 * @return {Void}
 */
app.afterStart = function(cb) {
	if(this.state !== STATE_STARTED) {
		utils.invokeCallback(cb, new Error('application is not running now.'));
		return;
	}

	var self = this;
	this._optComponents('afterStart', function(err) {
		self.state = STATE_STARTED;
		utils.invokeCallback(cb, err);
	});
};

/**
 * Stop components.
 *
 * @param  {Boolean} force whether stop the app immediately
 * @return {Void}
 */
app.stop = function(force) {
	if(this.state > STATE_STARTED) {
		logger.warn('[pomelo application] application is not running now.');
		return;
	}
	this.state = STATE_STOPED;
	stopComps(this.loaded, 0, force, function() {
		process.exit(0);
	});

};

/**
 * Stop components
 * @param  {Array}    comps component list
 * @param  {Number}   index current component index
 * @param  {Boolean}  force whether stop component immediately
 * @param  {Function} cb
 * @return {Void}
 */
var stopComps = function(comps, index, force, cb) {
	if(index >= comps.length) {
		cb();
		return;
	}
	var comp = comps[index];
	if(typeof comp.stop === 'function') {
		comp.stop(force, function() {
			// ignore any error
			stopComps(comps, index +1, force, cb);
		});
	} else {
		stopComps(comps, index +1, force, cb);
	}
};

/**
 * Apply command to loaded components.
 * This method would invoke the component {method} in series.
 * Any component {method} return err, it would return err directly.
 *
 * @param  {String}   method component lifecycle method name, such as: start, afterStart, stop
 * @param  {Function} cb
 * @return {Void}
 */
app._optComponents = function(method, cb) {
	async.forEachSeries(this.loaded, function(comp, done) {
		if(typeof comp[method] === 'function') {
			comp[method](done);
		} else {
			done();
		}
	}, function(err) {
		if(err) {
			logger.error('[pomelo application] fail to operate component, method:%s, err:' + err.stack, method);
		}
		utils.invokeCallback(cb, err);
	});
};

/**
 * Assign `setting` to `val`, or return `setting`'s value.
 * Mounted servers inherit their parent server's settings.
 *
 * @param {String} setting
 * @param {String} val
 * @return {Server|Mixed} for chaining, or the setting value
 * @api public
 */
app.set = function (setting, val) {
	if (1 == arguments.length) {
		if (this.settings.hasOwnProperty(setting)) {
			return this.settings[setting];
		} else if (this.parent) {
			return this.parent.set(setting);
		}
	} else {
		this.settings[setting] = val;
		this[setting] = val;
		return this;
	}
};

/**
 * Load Configure json file to settings.
 *
 * @param {String} key
 * @param {String} val
 * @return {Server|Mixed} for chaining, or the setting value
 * @api public
 */
app.loadConfig = function (key, val) {
    	var env = app.get('env');
	if (utils.endsWith(val, '.json')) {
		val = require(val); 
		if (!!val[env]) {
			val = val[env];
		}
	}
        this.set(key,val);
};

/**
 * Get servers from configure file
 * 
 * @param {String} val
 * @return {String} servers
 *
 */
app.getServers = function (val) {
	if (utils.endsWith(val, '.json')) {
		val = require(val);
	}
	var servers = val[app.env];
	return servers;
};

/**
 * Get property from setting
 * 
 * @param {String} setting
 * @return {String} val
 * @api public
 */
app.get = function (setting) {
	var val = this.settings[setting];
	return val;
};

/**
 * Check if `setting` is enabled.
 *
 * @param {String} setting
 * @return {Boolean}
 * @api public
 */
app.enabled = function (setting) {
	return !!this.set(setting);
};

/**
 * Check if `setting` is disabled.
 *
 * @param {String} setting
 * @return {Boolean}
 * @api public
 */
app.disabled = function (setting) {
	return !this.set(setting);
};

/**
 * Enable `setting`.
 *
 * @param {String} setting
 * @return {app} for chaining
 * @api public
 */
app.enable = function (setting) {
	return this.set(setting, true);
};

/**
 * Load service.
 *
 * @param {String} setting
 * @return {Void} 
 * @api public
 */
app.loadService = function (setting) {
	var settingPath = __dirname + '/common/service/' + setting + '.js';
	var exists = fs.existsSync(settingPath);
	if (exists) {
		require(settingPath).run(app.get(setting + 'Config'));
	}
};

/**
 * Disable `setting`.
 *
 * @param {String} setting
 * @return {app} for chaining
 * @api public
 */
app.disable = function (setting) {
	return this.set(setting, false);
};

/**
 * Configure callback for the specified env and server type. 
 * When no env is specified that callback will
 * be invoked for all environments and when no type is specified 
 * that callback will be invoked for all server types. 
 *
 * Examples:
 *
 *    app.configure(function(){
 *      // executed for all envs and server types
 *    });
 *
 *    app.configure('development', function(){
 *      // executed development env
 *    });
 *
 *    app.configure('development', 'connector', function(){
 *      // executed for development env and connector server type
 *    });
 *
 * @param {String} env...
 * @param {Function} fn
 * @return {app} for chaining
 * @api public
 */
app.configure = function (env, type, fn) {
	var args = [].slice.call(arguments);
	fn = args.pop();
	env = 'all'; 
	type = 'all';

	if(args.length > 0) {
		env = args[0];
	}
	if(args.length > 1) {
		type = args[1];
	}

	if (env === 'all' || env.indexOf(this.settings.env) >= 0) {
		if (type === 'all' || type.indexOf(this.settings.serverType) >= 0) {
			fn.call(this);
		}
	}
	return this;
};

/**
 * Find server by server type and server id
 * 
 * @param {String} serverType
 * @param {String} serverId
 * @return {server} curServer
 * @api public
 */
app.findServer = function (serverType, serverId) {
	var servers = app.get('servers');//[app.env];
	if(serverType === 'master') {
		return this.master;
	} else {
	var typeServers = servers[serverType];
		if(typeServers) {
			for (var i = 0; i < typeServers.length; i++) {
				var curServer = typeServers[i];
				if (curServer.id === serverId) {
					curServer.serverType = serverType;
					return curServer;
				}
			}
		}
	}
};

/**
 * Quit application in all servers
 * 
 * @return {Void}
 * @api public
 */
app.quit = function () {
	var servers = this.servers, cmd;
	for (var serverType in servers) {
		if (serverType === 'master' || serverType === 'connector') {
			continue;
		}
		var typeServers = servers[serverType];
		for (var i = 0; i < typeServers.length; i++) {
			var server = typeServers[i];
			if (server.host === '127.0.0.1' || server.host === 'localhost') {
				process.exit(1);
			} else {
				cmd = "kill   -9   `ps   -ef | grep node|awk   '{print   $2}'`";
				starter.sshrun(cmd, server.host);
			}
		}
	}
	try {
		cmd = "kill   -9   `ps   -ef | grep node|awk   '{print   $2}'`";
		starter.run(cmd);
		process.exit(1);
	} catch (ex) {
		logger.error('quit get error ' + ex);
	}
};

/**
 * Kill application in all servers
 *
 * @param {String} pid
 * @param {String} serverId
 * @return {Void}
 * @api public
 */
app.kill = function (pid, serverId) {
	var servers = this.servers;
	for (var serverType in servers) {
		var typeServers = servers[serverType];
		for (var i = 0; i < typeServers.length; i++) {
			var server = typeServers[i];
			for (var j = 0; j < serverId.length; j++) {
				if (server.id === serverId[j]) {
					var cmd = 'kill -9 ' + pid[j];
					if (server.host === '127.0.0.1' || server.host === 'localhost') {
						starter.localrun(cmd);
					}
					else {
						starter.sshrun(cmd, server.host);
					}
				}
			}
		}
	}
};

Object.defineProperty(app, 'curserver', {
	get:function () {
		return app.findServer(app.serverType, app.serverId);
	}
});

/**
 * Check the server whether is a frontend server
 *
 * @param  {server}  server server info. it would check current server
 *                          if server not specified
 * @return {Boolean}
 */
app.isFrontend = function(server) {
	server = server || app.curserver;
	return !!server && !!server.wsPort;
};

/**
 * Check the server whether is a backend server
 *
 * @param  {server}  server server info. it would check current server
 *                          if server not specified
 * @return {Boolean}
 */
app.isBackend = function(server) {
	server = server || app.curserver;
	return !!server && !server.wsPort;
};

/**
 * Check whether current server is a master server
 *
 * @return {Boolean}
 */
app.isMaster = function() {
	return app.serverType === 'master';
};

/**
 * register admin modules 
 * @param {moduleId} module id
 * @param {module} module object
 * @param {requireApp} boolean true module require app instance
 *								false do not require app instance
 * @return {Boolean}
 */
 app.registerAdmin = function(moduleId,module,requireApp){
	this.modules[moduleId] = {
		module : module,
		requireApp : requireApp || false
	} 	
 }
