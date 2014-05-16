var Code = require('../../../../../shared/code');
var bearcat = require('bearcat');
/**
 * Gate handler that dispatch user to connectors.
 */
var GateHandler = function(app) {
	this.app = app;
	this.dispatcher = null;
};

GateHandler.prototype.queryEntry = function(msg, session, next) {
	var uid = msg.uid;
	if (!uid) {
		next(null, {
			code: Code.FAIL
		});
		return;
	}

	var connectors = this.app.getServersByType('connector');
	if (!connectors || connectors.length === 0) {
		next(null, {
			code: Code.GATE.NO_SERVER_AVAILABLE
		});
		return;
	}

	var res = this.dispatcher.dispatch(uid, connectors);
	next(null, {
		code: Code.OK,
		host: res.host,
		port: res.clientPort
	});
};

module.exports = function(app) {
	return bearcat.getBean({
		id: "gateHandler",
		func: GateHandler,
		args: [{
			name: "app",
			value: app
		}],
		props: [{
			name: "dispatcher",
			ref: "dispatcher"
		}]
	});
};