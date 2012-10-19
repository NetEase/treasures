var utils = require('../util/utils');
var logger = require('../util/log/log').getLogger(__filename);

var Module = function(app) {
	this.app = app;
};

module.exports = Module;

module.exports.moduleId = '__starter__';

var pro = Module.prototype;

pro.monitorHandler = function(msg, cb) {
	logger.debug('[starter] after start: %j', this.app.serverId);
	var self = this;
	this.app.afterStart(function(err) {
		if(err) {
			logger.error('fail to call afterStart lifecycle, now try to stop server. ' + err.stack);
			self.app.stop(true);
		}
	});
};
