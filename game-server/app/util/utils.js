var util = require('util');

var utils = module.exports;

// callback util
utils.invokeCallback = function(cb) {
	if (!!cb && typeof cb == 'function') {
		cb.apply(null, Array.prototype.slice.call(arguments, 1));
	}
};

//generate a random number between min and max
utils.rand = function (min, max) {
  var n = max - min;
  return min + Math.round(Math.random() * n);
};

// clone a object
utils.clone = function(o) {
	var n = {};
	for (var k in o) {
		n[k] = o[k];
	}
	
	return n;
};

