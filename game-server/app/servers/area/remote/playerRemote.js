var bearcat = require('bearcat');

var PlayerRemote = function(app) {
	this.app = app;
	this.utils = null;
	this.consts = null;
	this.areaService = null;
}

/**
 * Player exits. It will persistent player's state in the database.
 *
 * @param {Object} args
 * @param {Function} cb
 * @api public
 */
PlayerRemote.prototype.playerLeave = function(args, cb) {
	var areaId = args.areaId;
	var playerId = args.playerId;
	var player = this.areaService.getPlayer(playerId);

	if (!player) {
		this.utils.invokeCallback(cb);
		return;
	}
	this.areaService.removePlayer(playerId);
	this.areaService.getChannel().pushMessage({
		route: 'onUserLeave',
		code: this.consts.MESSAGE.RES,
		playerId: playerId
	});
	this.utils.invokeCallback(cb);
};

module.exports = function(app) {
	return bearcat.getBean({
		id: "playerRemote",
		func: PlayerRemote,
		args: [{
			name: "app",
			value: app
		}],
		props: [{
			name: "areaService",
			ref: "areaService"
		}, {
			name: "utils",
			ref: "utils"
		}, {
			name: "consts",
			ref: "consts"
		}]
	});
};