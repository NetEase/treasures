var manager = module.exports;

var pomelo = require('./pomelo');
var logger = require('./util/log/log').getLogger(__filename);
var utils = require('./util/utils');
var msgUtil = require('./util/msgUtil');
var forward_logger = require('./util/log/log').getLogger('forward-log');

var handlers = [];

/**
 * Handler the request.
 * Process the request directly if the route type matches current server type.
 * Or just forward to the other server if the route type dose not match.
 *
 * @param msg {Object}: client request message.
 * @param session {Object}: session object for current request
 * @param cb {Function}: callback function for the handler has finished.
 */
manager.handle = function(msg, session, cb){
	var routeRecord = msgUtil.parseRoute(msg.route);
	if(!routeRecord) {
		cb(new Error('meet unknown route message %j', msg.route));
		return;
	}

	var app = pomelo.app;
	if(app.serverType === routeRecord.serverType) {
		// the request should be processed by current server
		var originMsg = JSON.parse(msg.body);
		var handler = getHandler(app, routeRecord);
		if(!handler) {
			logger.error('[handleManager]: fail to find handler for %j', msg.route);
			cb(new Error('fail to find handler for ' + msg.route));
			return;
		}
		var start = Date.now();
		handler[routeRecord.method](originMsg, session, function(err,resp){
			var log = {
		      route : msg.route,
		      args : msg,
		      time : utils.format(new Date(start)),
		      timeUsed : new Date() - start
		    };
		    forward_logger.info(JSON.stringify(log));
			cb(err,resp);
		});
		return;
	}

	//should route to other servers
	try {
		app.sysrpc[routeRecord.serverType].msgRemote.forwardMessage(
			session,
			msg, 
			session.exportSession(), 
			function(err, resp) {
				if(err) {
					logger.error('[handlerManager] fail to process remote message:' + err.stack);
				}
				cb(err, resp);
			}
		);
	} catch(err) {
		logger.error('[handlerManager] fail to forward message:' + err.stack);
		cb(err);
	}
};

/**
 * Get handler instance by routeRecord.
 * 
 * @param  {Object} app         appliction context
 * @param  {Object} routeRecord route record parsed from route string
 * @return {Object}             handler instance if any matchs or null for match fail
 */
var getHandler = function(app, routeRecord) {
	var handler = app.handlers[routeRecord.handler];
	if(!handler) {
		return null;
	}
	if(typeof handler[routeRecord.method] !== 'function') {
		return null;
	}
	return handler;
};
