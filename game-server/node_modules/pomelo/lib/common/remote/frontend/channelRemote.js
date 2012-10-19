/**
 * Remote channel service for frontend server.
 * Receive push request from backend servers and push it to clients.
 */
var logger = require('../../../util/log/log').getLogger(__filename);
var sessionService = require('../../service/sessionService');

var exp = module.exports;

/**
 * Push message to client by uids
 *
 * @param msg {Object} message that would be push to clients
 * @param uids {Array} user ids that would receive the message
 * @param cb {Function} callback function
 */
exp.pushMessage = function(msg, uids, cb) {
	for(var i=0, l=uids.length; i<l; i++) {
		sessionService.sendMessageByUid(uids[i], msg);
	}
	cb();
};
