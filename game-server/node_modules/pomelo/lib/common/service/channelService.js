var channelManager = require('./channelManager');
var pomelo = require('../../pomelo');
var exp = module.exports;

/**
 * Get local channel instance
 *
 * @param opts {Object} channel info parameters {name: channelName, create: createIfNotExist}
 */
exp.getLocalChannelSync = function(opts) {
  return channelManager.getChannel(opts.name, opts.create);
};

/**
 * push message by uids
 * group the uids by group. query status server for sid if sid not specified.
 *
 * @param msg {Object} message that would be sent to client
 * @param uids {Array} [{uid: userId, sid: serverId}] or [uids]
 * @param cb {Function} cb(err)
 */
exp.pushMessageByUids = function(msg, uids, cb) {
  channelManager.pushMessageByUids(msg, uids, cb);
};

