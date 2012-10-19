var pomelo = require('../../pomelo');
var countDownLatch = require('../../util/countDownLatch');
var utils = require('../../util/utils');
var logger = require('../../util/log/log').getLogger(__filename);
var async = require('async');

var exp = module.exports;

var DEFAULT_GROUP_ID = 'default';

var ST_INITED = 0;
var ST_DESTROYED = 1;

var channels = {};

var Channel = function(name) {
	this.groups = {};			//group map for uids. key: sid, value: [uid]
	this.state = ST_INITED;
};

var pro = Channel.prototype;

/**
 * add user to channel
 *
 * @param uid user id
 * @param sid frontend server id which user has connected to
 */
pro.add = function(uid, sid) {
  if(this.state > ST_INITED) {
    return false;
  } else {
    return add(uid, sid, this.groups);
  }
};

/**
 * remove user from channel
 *
 * @param uid user id
 * @param sid frontend server id which user has connected to. 
 * @return [Boolean] true if success or false if fail
 */
pro.leave = function(uid, sid) {
	return deleteFrom(uid, sid, this.groups[sid]);
};

/**
 * destroy channel
 */
pro.destroy = function() {
  this.state = ST_DESTROYED;
  exp.destroyChannel(this.name);
};

/**
 * push message to all the members in the channel
 *
 * @param msg {Object} message that would be sent to client
 * @param cb {Functioin} cb(err)
 */
pro.pushMessage = function(msg, cb) {
	sendMessageByGroup(msg, this.groups, cb);
};

/**
 * create channel with name
 */
exp.createChannel = function(name) {
	if(!!channels[name]) {
		return channels[name];
	}

	var c = new Channel(name);
	channels[name] = c;
	return c;
};

/**
 * get channel by name
 */
exp.getChannel = function(name, create) {
  var channel = channels[name];
  if(!channel && !!create) {
    channel = channels[name] = new Channel(name);
  }
	return channel;
};

/**
 * destroy channel
 */
exp.destroyChannel = function(name) {
  delete channels[name];
};

/**
 * push message by uids
 * group the uids by group. ignore any uid if sid not specified.
 *
 * @param msg {Object} message that would be sent to client
 * @param uids {Array} [{uid: userId, sid: serverId}]
 * @param cb {Function} cb(err)
 */
exp.pushMessageByUids = function(msg, uids, cb) {
	if(!uids || uids.length === 0) {
		utils.invokeCallback(cb, new Error('uids should not be empty'));
		return;
	}
	var groups = {}, record;
	for(var i=0, l=uids.length; i<l; i++) {
		record = uids[i];
		add(record.uid, record.sid, groups);
	}

	sendMessageByGroup(msg, groups, cb);
};

/**
 * add uid and sid into group. ignore any uid that uid not specified.
 *
 * @param uid user id
 * @param sid server id
 * @param groups {Object} grouped uids, , key: sid, value: [uid]
 */
var add = function(uid, sid, groups) {
	if(!sid) {
		logger.warn('ignore uid %j for sid not specified.', uid);
		return false;
	}

	var group = groups[sid];
	if(!group) {
		group = [];
		groups[sid] = group;
	}

	group.push(uid);
	return true;
};

/**
 * delete element from array
 */
var deleteFrom = function(uid, sid, group) {
	if(!group) {
		return true;
	}
	
	for(var i=0, l=group.length; i<l; i++) {
		if(group[i] === uid) {
			group.splice(i, 1);
			return true;
		}
	}

  return false;
};

/**
 * push message by group
 *
 * @param msg {Object} message that would be sent to client
 * @param groups {Object} grouped uids, , key: sid, value: [uid]
 * @param cb {Function} cb(err)
 */
var sendMessageByGroup = function(msg, groups, cb) {
	var app = pomelo.app;
	var rpcClient = app.components.proxy.client;
	var namespace = 'sys';
	var service = 'channelRemote';
	var method = 'pushMessage';
	var count = 0;
	var successFlag = false;
	msg = JSON.stringify(msg);
	for(var sid in groups) {
		count++;
		var uids = groups[sid];
		rpcClient.rpcInvoke(sid, {namespace: namespace, service: service, method: method, args: [msg, uids]}, function(err) {
			if(err) {
				logger.error('[pushMessage] fail to dispatch msg, err:' + err.stack);
				latch.done();
				return;
			}
			successFlag = true;
			latch.done();
		});
	}

	if(count === 0) {
		// group is empty
		utils.invokeCallback(cb);
		return;
	}

	var latch = countDownLatch.createCountDownLatch(count, function(){
		if(!successFlag) {
			utils.invokeCallback(cb, new Error('all uids push message fail'));
			return;
		}
		utils.invokeCallback(cb);
	});
}; 
