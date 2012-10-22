var logger = require('pomelo-logger').getLogger(__filename);
var formula = module.exports;

/**
 * Check the distance between origin and target whether less than the range.
 *
 * @param origin {Object} origin entity
 * @param target {Object} target entity
 * @param range {Number} the range of distance
 */
formula.inRange = function(origin, target, range) {
  var dx = origin.x - target.x;
  var dy = origin.y - target.y;
  return dx * dx + dy * dy <= range * range;
};

formula.distance = function(x1, y1, x2, y2) {
  var dx = x2 - x1;
  var dy = y2 - y1;

  return Math.sqrt(dx * dx + dy * dy);
};

/**
 * convert the date according to format
 * @param {Object} date
 * @param {String} format
 * @param {String} 
 */
formula.timeFormat = function(date) {
  var n = date.getFullYear(); 
  var y = date.getMonth() + 1;
  var r = date.getDate(); 
  var mytime = date.toLocaleTimeString(); 
  var mytimes = n + "-" + y + "-" + r + " " + mytime;
  return mytimes;
}

function check(num) {
  return num > 9 ? num : '0' + num;
}

