/**
 *Module dependencies
 */

var exec = require('child_process').exec
	, util = require('../utils/util');

/**
 * Expose 'getPsInfo' constructor
 */

module.exports.getPsInfo = getPsInfo;

/**
 * get the process information by command 'ps auxw | grep serverId | grep pid'
 *
 * @param {Object} param
 * @param {Function} callback
 * @api public
 */

function getPsInfo(param, callback) { 
	if (process.platform != 'linux') return;
	var pid = param.pid, serverId = param.serverId || 'node-1';
	exec("ps auxw | grep " + serverId + " | grep " + pid, function(err, output) {
		if (!!err) {
			console.error('getPsInfo failed! ' + err.stack);
			return;
		}
      format(param, output, callback);
	});
};

/**
 * convert serverInfo to required format, and the callback will handle the serverInfo 
 *
 * @param {Object} param, contains serverId etc
 * @param {String} data, the output if the command 'ps'
 * @param {Function} cb
 * @api private
 */

function format(param, data, cb) {
	var time = util.formatTime(new Date());
	var outArray = data.toString().replace(/^\s+|\s+$/g,"").split(/\s+/);
	var outValueArray = [];
	for (var i = 0; i < outArray.length; i++) {
		if ((!isNaN(outArray[i]))) {
			outValueArray.push(outArray[i]);
		}
	}
	var ps = {};
	ps.time = time;
	ps.serverId = param.serverId;
	ps.serverType = ps.serverId.split('-')[0];
	var pid = ps.pid = param.pid;
	ps.cpuAvg = outValueArray[1];
	ps.memAvg = outValueArray[2];
	ps.vsz = outValueArray[3];
	ps.rss = outValueArray[4];
	outValueArray = [];
	exec('pidstat -p ' + pid, function(err, output) {
		if (!!err) {
			console.error('the command pidstat failed! ', err.stack);
			return;
		}
		var outArray = output.toString().replace(/^\s+|\s+$/g,"").split(/\s+/);
		for (var i = 0; i < outArray.length; i++) {
		  if ((!isNaN(outArray[i]))) {
				outValueArray.push(outArray[i]);
			}
		}
		ps.usr = outValueArray[1];
		ps.sys = outValueArray[2];
		ps.gue = outValueArray[3];

		cb(ps);
	});
};

