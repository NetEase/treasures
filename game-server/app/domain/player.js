var logger = require('pomelo-logger').getLogger('bearcat-treasures', 'Player');
var bearcat = require('bearcat');
var util = require('util');

/**
 * Initialize a new 'Player' with the given 'opts'.
 * Player inherits Character
 *
 * @param {Object} opts
 * @api public
 */

function Player(opts) {
  this.opts = opts;
  this.id = opts.id;
  this.type = null;
  this.name = opts.name;
  this.walkSpeed = 240;
  this.score = opts.score || 0;
  this.target = null;
}

Player.prototype.init = function() {
  this.type = this.consts.EntityType.PLAYER;
  var Entity = bearcat.getFunction('entity');
  Entity.call(this, this.opts);
  this._init();
}

Player.prototype.addScore = function(score) {
  this.score += score;
};

/**
 * Parse String to json.
 * It covers object' method
 *
 * @param {String} data
 * @return {Object}
 * @api public
 */
Player.prototype.toJSON = function() {
  var r = this._toJSON();

  r['id'] = this.id;
  r['type'] = this.type;
  r['name'] = this.name;
  r['walkSpeed'] = this.walkSpeed;
  r['score'] = this.score;

  return r;
};

module.exports = {
  id: "player",
  func: Player,
  scope: "prototype",
  parent: "entity",
  init: "init",
  args: [{
    name: "opts",
    type: "Object"
  }],
  props: [{
    name: "consts",
    ref: "consts"
  }]
}