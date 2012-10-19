/**
 * Component for remote service.
 * Load remote service and add to global context.
 */
var utils = require('../util/utils');
var logger = require('../util/log/log').getLogger(__filename);
var fs = require('fs');
var pathUtil = require('../util/pathUtil');
var RemoteServer = require('pomelo-rpc').server;

/**
 * Remote component factory function
 * 
 * @param  {Object} app  current application context
 * @param  {Object} opts construct parameters
 *                       opts.acceptorFactory {Object}: acceptorFactory.create(opts, cb)
 * @return {Object}      remote component instances
 */
module.exports = function(app, opts) {
  opts = opts || {};
  opts.cacheMsg = opts.cacheMsg || true;
  opts.interval = opts.interval || 30;
  return new Remote(app, opts);
};

/**
 * Remote component class
 * 
 * @param {Object} app  current application context
 * @param {Object} opts construct parameters
 */
var Remote = function(app, opts) {
  this.app = app;
  this.opts = opts;
};

var pro = Remote.prototype;

/**
 * component name
 */
pro.name = 'remote';

/**
 * Remote component lifecycle function
 * 
 * @param  {Function} cb 
 * @return {Void}      
 */
pro.start = function(cb) {
  this.opts.port = this.app.findServer(this.app.serverType, this.app.serverId).port;
  this.remote = genRemote(this.app, this.opts);
  this.remote.start();
  process.nextTick(function() {
    utils.invokeCallback(cb);
  });
};

/**
 * Remote component lifecycle function
 * 
 * @param  {Boolean}   force whether stop the component immediately 
 * @param  {Function}  cb    
 * @return {Void}         
 */
pro.stop = function(force, cb) {
  this.remote.stop(force);
  process.nextTick(function() {
    utils.invokeCallback(cb);
  });
};

/**
 * Get remote paths from application
 * 
 * @param {Object} app current application context
 * @return {Array} paths
 *
 */
var getRemotePaths = function(app) {
  var paths = [];
  
  var role;
  // master server should not come here
  if(app.isFrontend()) {
    role = 'frontend';
  } else {
    role = 'backend';
  }

  var sysPath = pathUtil.getSysRemotePath(role);
  if(fs.existsSync(sysPath)) {
    paths.push(pathUtil.remotePathRecord('sys', app.serverType, sysPath));
  }
  var userPath = pathUtil.getUserRemotePath(app.get('dirname'), app.serverType);
  if(fs.existsSync(userPath)) {
    paths.push(pathUtil.remotePathRecord('user', app.serverType, userPath));
  }

  return paths;
};

/**
 * Generate remote server instance
 * 
 * @param  {Object} app current application context 
 * @param  {Object} opts contructor parameters for rpc Server
 * @return {Object} remote server instance
 */
var genRemote = function(app, opts) {
  opts.paths = getRemotePaths(app);
  opts.context = app;
  return RemoteServer.create(opts);
};
