/**
 * Remote service for backend servers.
 * Receive and process request message that forward from frontend server.
 */
var pomelo = require('../../../pomelo');
var logger = require('../../../util/log/log').getLogger(__filename);
var sessionService = require('../../service/mockSessionService');
var utils = require('../../../util/utils');
var forward_logger = require('../../../util/log/log').getLogger('forward-log');

/**
 * Forward message from frontend server to other server's handlers
 *
 * @param msg {Object} request message
 * @param session {Object} session object for current request
 * @param cb {Function} callback function
 */
module.exports.forwardMessage = function(msg, session, cb) {
  var server = pomelo.app.components.server.server;
  if(!server) {
    utils.invokeCallback(cb, new Error('server component not enable'));
    return;
  }

  // generate session for current request
  session = sessionService.createSession(session);
  // handle the request
  server.handle(msg, session, function(err, resp) {
    cb(err, resp);
  });
};
