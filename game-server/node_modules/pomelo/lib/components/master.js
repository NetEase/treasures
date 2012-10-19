/**
 * Component for master.
 */
var logger = require('../util/log/log').getLogger(__filename);
var Server = require('../master/master');

/**
 * Component factory function
 *
 * @param  {Object} app  current application context
 * @return {Object}      component instances
 */
module.exports = function (app) {
	return new Master(app);
};

module.exports.name = '__master__';

/**
* Master component class
* 
* @param {Object} app  current application context
*/
var Master = function (app) {
    this.app = app;
    this.master = app.master;
    this.server = new Server(app);
};

var pro = Master.prototype;

/**
 * Component lifecycle function
 * 
 * @param  {Function} cb 
 * @return {Void}      
 */
pro.start = function (cb) {
    this.server.start(cb);
};

/**
 * Component lifecycle function
 * 
 * @param  {Boolean}   force whether stop the component immediately 
 * @param  {Function}  cb    
 * @return {Void}         
 */
pro.stop = function (force, cb) {
	cb();
};
