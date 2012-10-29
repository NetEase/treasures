/**
 * Module dependencies
 */

var utils = require('../../../util/utils');
var area = require('../../../models/area');
var consts = require('../../../consts/consts');
var messageService = require('../../../models/messageService');


var exp = module.exports;

/**
 * Player exits. It will persistent player's state in the database. 
 *
 * @param {Object} args
 * @param {Function} cb
 * @api public
 */
exp.playerLeave = function(args, cb) {
	var areaId = args.areaId;
	var playerId = args.playerId;
	var player = area.getPlayer(playerId);

	if (!player) {
		utils.invokeCallback(cb);
		return;
	}
	area.removePlayer(playerId);
	messageService.pushMessage({route: 'onUserLeave', code: consts.MESSAGE.RES, playerId: playerId});
	utils.invokeCallback(cb);
};

exp.addPlayer = function(playerName, cb) {

};
