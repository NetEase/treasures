__resources__["player.js"] = {
  meta: {mimetype: "application/javascript"},
  data: function(exports, require, module, __filename, __dirname) {

    var Entity = require('entity');
    var aniName = require('consts').AnimationName;

    /**
     * Initialize a new 'Character' with the given 'opts'.
     * Character inherits Entity 
     *
     * @param {Object} opts
     * @api public
     */
    function Player(opts) {
      this.walkSpeed = opts.walkSpeed;
      this.id = opts.id;
      this.type = 'player';
      this.name = opts.name;
      this.treasureCount = opts.treasureCount || 0;
      this.target = null;

      //status
      this.died = false;
      Entity.call(this, opts);
    }

    Player.prototype = Object.create(Entity.prototype);
    module.exports = Player;

  }
};


