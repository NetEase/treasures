/**
 * Component for server starup.
 */
var logger = require('../util/log/log').getLogger(__filename);
var Server = require('../server/server');

/**
 * Component factory function
 * 
 * @param  {Object} app  current application context
 * @param  {Object} opts construct parameters
 * @return {Object}      component instance
 */
module.exports = function(app, opts) {
  opts = opts || {};
  return new ServerComponent(app, opts);
};

/**
 * Server component class
 * 
 * @param {Object} app  current application context
 * @param {Object} opts construct parameters
 */
var ServerComponent = function(app, opts) {
  opts = opts || {};
  opts.server = app.server;
  this.server = Server.create(app, opts);
};

var pro = ServerComponent.prototype;

pro.name = 'server';

/**
 * Component lifecycle callback 
 * 
 * @param  {Function} cb 
 * @return {Void}     
 */
pro.afterStart = function(cb) {
  this.server.afterStart(cb);
};

/**
 * Component lifecycle function
 * 
 * @param  {Boolean}   force whether stop the component immediately 
 * @param  {Function}  cb    
 * @return {Void}         
 */
pro.stop = function(force, cb) {
	this.server.stop(cb);
};
