var util = require('util');
var Entity = require('./entity');
var EntityType = require('../consts/consts').EntityType;

/**
 * Initialize a new 'Treasure' with the given 'opts'.
 * Item inherits Entity
 *
 * @param {Object} opts
 * @api public
 */

function Treasure(opts) {
  Entity.call(this, opts);
  this.type = EntityType.TREASURE;
  this.imgId = opts.imgId;
}

util.inherits(Treasure, Entity);

module.exports = Treasure;
