
/**
 * Filter to keep request sequence.
 */
var pomelo = require('../../lib/pomelo');
var logger = require('../util/log/log').getLogger(__filename);
var taskManager = require('../common/service/taskManager');

var filter = module.exports;

/**
 * request serialization after filter
 */
filter.before = function(msg, session, next){
  if(!session || !session.key) {
      next(new Error('fail to do serialize for session or session.key is empty.'));
      return;
  }

  taskManager.addTask(session.key, function(task) {
    session.__serialTask__ = task;
    next();
  }, function() {
    logger.error('[serialFilter] msg timeout, msg:' + JSON.stringify(msg));
  });
};

/**
 * request serialization after filter
 */
filter.after = function(err, msg, session, resp, next) {
  var task = session.__serialTask__;
  if(task) {
    if(!task.done() && !err) {
        err = new Error('task time out. msg:' + JSON.stringify(msg));
    }
  }
  next(err, resp);
};

/**
 * Filter to keep request sequence.
 */
var pomelo = require('../../../lib/pomelo');
var logger = require('../../util/log/log').getLogger(__filename);
var taskManager = require('../../common/service/taskManager');

var filter = module.exports;
module.exports = function() {
  return new Filter();
};

var Filter = function() {
};

/**
 * request serialization after filter
 */
Filter.prototype.before = function(msg, session, next){
  if(!session || !session.key) {
			next(new Error('fail to do serialize for session or session.key is empty.'));
			return;
  }

  taskManager.addTask(session.key, function(task) {
    session.__serialTask__ = task;
    next();
  }, function() {
		logger.error('[serialFilter] msg timeout, msg:' + JSON.stringify(msg));
	});
};

/**
 * request serialization after filter
 */
Filter.prototype.after = function(err, msg, session, resp, next) {
  var task = session.__serialTask__;
  if(task) {
    if(!task.done() && !err) {
        err = new Error('task time out. msg:' + JSON.stringify(msg));
    }
  }
  next(err, resp);
};

