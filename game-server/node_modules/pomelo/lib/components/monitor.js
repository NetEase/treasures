/**
 * Component for monitor.
 * Load and start monitor client.
 */
var logger = require('../util/log/log').getLogger(__filename);
var Server = require('../monitor/monitor');
var utils = require('../util/utils');

/**
 * Component factory function
 * 
 * @param  {Object} app  current application context
 * @return {Object}      component instances
 */
module.exports = function(app) {
	return new Monitor(app);
};

module.exports.name = '__monitor__';

var Monitor = function(app) {
	this.server = new Server(app);
};

var pro = Monitor.prototype;

pro.start = function(cb) {
	this.server.start(cb);
};

pro.stop = function(force, cb) {
	this.server.stop(cb);
};
