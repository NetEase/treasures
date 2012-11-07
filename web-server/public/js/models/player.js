__resources__["/player.js"] = {
  meta: {mimetype: "application/javascript"},
  data: function(exports, require, module, __filename, __dirname) {

    var Entity = require('entity');

    /**
     * Initialize a new 'Player' with the given 'opts'.
     * Player inherits Entity 
     *
     * @param {Object} opts
     * @api public
     */
    function Player(opts) {
      this.walkSpeed = opts.walkSpeed;
      this.id = opts.id;
      this.type = 'player';
      this.name = opts.name;
      this.score = opts.score || 0;
      this.target = null;

      Entity.call(this, opts);
    }

    Player.prototype = Object.create(Entity.prototype);

    module.exports = Player;
  }
};


