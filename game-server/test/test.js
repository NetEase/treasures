var util = require('util');

var a = function() {
	this.test();
}

a.prototype.test = function() {
	console.log('test');
}

var b = function() {
	a.call(this);
	// this.init();
}

util.inherits(b, a);

b.prototype.init = function() {
	console.log('init');
}

// b.call(null);
// var aa = new a();
// aa.test();

var bb = new b();
console.log(bb instanceof a);
// bb.init();
// console.log(a);
// console.log(b);