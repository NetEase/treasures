/**
 * Component for proxy.
 * Generate proxies for rpc client.
 */
var utils = require('../util/utils');
var Client = require('pomelo-rpc').client;
var pathUtil = require('../util/pathUtil');
var app = require('../application');
var pomelo = require('../pomelo');
var crc = require('crc');

/**
 * Component factory function
 * 
 * @param  {Object} app  current application context
 * @param  {Object} opts construct parameters
 *                      opts.router: (optional) rpc message route function, route(routeParam, msg, cb), 
 *                      opts.mailBoxFactory: (optional) mail box factory instance.
 * @return {Object}      component instance
 */
module.exports = function(app, opts) {
  opts = opts || {};
  // proxy default config
  opts.cacheMsg = opts.cacheMsg || true;
  opts.interval = opts.interval || 30;
  opts.lazyConnect = opts.lazyConnect || true;
  opts.router = genRouteFun();
  opts.context = app;
  opts.routeContext = app;
  opts.servers = app.get('servers');

  return new Proxy(app, opts);
};

/**
 * Proxy component class
 * 
 * @param {Object} app  current application context
 * @param {Object} opts construct parameters
 */
var Proxy = function(app, opts) {
  this.client = null;
  this.app = app;
  this.opts = opts;
  this.client = genRpcClient(this.app, opts);
};

var pro = Proxy.prototype;

/**
 * component name
 */
Proxy.prototype.name = 'proxy';

/**
 * Proxy component lifecycle function
 * 
 * @param  {Function} cb 
 * @return {Void}      
 */
pro.start = function(cb) {
  if(this.opts.enableRpcLog) {
    this.client.filter(require('../filters/rpc/rpcLogFilter'));
  }
  process.nextTick(function() {
      utils.invokeCallback(cb);
  });
};

/**
 * Component lifecycle callback 
 * 
 * @param  {Function} cb 
 * @return {Void}     
 */
pro.afterStart = function(cb) {
  this.app.set('rpc', this.client.proxies.user);
  this.app.set('sysrpc', this.client.proxies.sys);
  this.client.start(cb);
};

/**
 * Generate rpc client
 *
 * @param {Object} app current application context
 * @param {Object} opts contructor parameters for rpc client
 * @return {Object} rpc client
 */
var genRpcClient = function(app, opts) {
  var paths = getProxyPaths(app);
  opts.paths = paths;
  opts.context = app;
  opts.routeContext = app;

  return Client.create(opts);
};

/**
 * Get proxy path for rpc client.
 * Iterate all the remote service path and create remote path record.
 * 
 * @param  {Object} app current application context
 * @return {Array}     remote path record array
 */
var getProxyPaths = function(app) {
  var paths = [], appBase = app.get('dirname'), p;
  var servers = app.servers, slist, sinfo, i, l;
  for(var serverType in servers) {
    slist = servers[serverType];
    for(i=0, l=slist.length; i<l; i++) {
      sinfo = slist[i];
      // sys remote service path record
      if(app.isFrontend(sinfo)) {
        p = pathUtil.getSysRemotePath('frontend');
      } else {
        p = pathUtil.getSysRemotePath('backend');
      }
      if(p) {
        paths.push(pathUtil.remotePathRecord('sys', serverType, p));
      }

      // user remote service path record
      p = pathUtil.getUserRemotePath(appBase, serverType);
      if(p) {
        paths.push(pathUtil.remotePathRecord('user', serverType, p));
      }
    } // end of inner for
  } // end of outer for

  return paths;
};

var genRouteFun = function() {
  return function(session, msg, app, cb) {
    var type = msg.serverType, route = app.routes[type] || app.routes['default'];

    if(route) {
      route(session, msg, app, cb);
    } else {
      defaultRoute(session, msg, app, cb);
    }
  };
};

var defaultRoute = function(session, msg, app, cb) {
  var servers = app.get('servers');

  if(!servers) {
    cb(new Error('empty server configs.'));
    return;
  }

  var list = servers[msg.serverType];
  if(!list) {
    cb(new Error('can not find server info for type:' + msg.serverType));
    return;
  }

  var uid = session ? (session.uid || '') : '';
  var index = Math.abs(crc.crc32(uid)) % list.length;
  cb(null, list[index].id);
};