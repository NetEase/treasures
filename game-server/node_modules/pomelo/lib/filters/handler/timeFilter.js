/**
 * Filter for statistics.
 * Record used time for each request.
 */
var con_logger = require('pomelo-logger').getLogger('con-log');
var filter = module.exports;
module.exports = function() {
  return new Filter();
};

var Filter = function() {
};

Filter.prototype.before = function(msg, session, next) {
  session.__startTime__ = Date.now();
  next();
};

Filter.prototype.after = function(err, msg, session, resp, next) {
  var start = utils.format(session.__startTime__);
  if(typeof start === 'number') {
    var timeUsed = Date.now() - start;
    var log = {
      route : msg.route,
      args : msg,
      time : start,
      timeUsed : timeUsed
    };
    con_logger.info(JSON.stringify(log));
  }
  next(err,msg);
};
