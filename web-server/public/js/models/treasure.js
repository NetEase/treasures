__resources__["/treasure.js"] = {
  meta: {mimetype: "application/javascript"},
  data: function(exports, require, module, __filename, __dirname) {
    // Module dependencies 
    var Entity = require('entity');

    /**
     * Initialize a new 'Item' with the given 'opts'.
     * Item inherits Entity
     *
     * @param {Object} opts
     * @api public
     */
    function Treasure(opts) {
      this.type = 'treasure';
      this.name = opts.name;
      this.imgId = opts.imgId;
      this.score = opts.score || 0;
      Entity.call(this, opts);
    }

    Treasure.prototype = Object.create(Entity.prototype);

    /**
     * Expose 'Item' constructor.
     */
    module.exports = Treasure;
  }
};

