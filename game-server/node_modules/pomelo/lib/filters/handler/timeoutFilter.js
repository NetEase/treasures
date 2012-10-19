/**
 * Filter for timeout. 
 * Print a warn information when request timeout.
 */
var logger = require('../../util/log/log').getLogger(__filename);

var DEFAULT_TIMEOUT = 3000;

module.exports = function(timeout) {
  return new Filter(timeout || DEFAULT_TIMEOUT);
};

var Filter = function(timeout) {
  this.timeout = timeout;
  this.timeouts = {};
  this.curId = 0;
};

Filter.prototype.before = function(msg, session, next) {
  this.curId++;
  this.timeouts[this.curId] = setTimeout(function() {
    logger.warn('request %j timeout.', msg.route);
  }, this.timeout);
  session.__timeout__ = this.curId;
  next();
};

Filter.prototype.after = function(err, msg, session, resp, next) {
  var timeout = this.timeouts[session.__timeout__];

  if(timeout) {
    clearTimeout(timeout);
    delete this.timeouts[session.__timeout__];
  }
  
  next(err, msg);
};
