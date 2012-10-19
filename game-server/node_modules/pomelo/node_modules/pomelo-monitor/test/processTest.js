var processMonitor = require('../lib/processMonitor');

function test() {
	var param = {
		pid: process.pid,
		serverId: 'node-1'
	};
	processMonitor.getPsInfo(param, function(data) {
		console.log('process information is :', data);
	});
};

test();
