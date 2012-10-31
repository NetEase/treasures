__resources__["/entity.js"] = {
  meta: {mimetype: "application/javascript"},
  
  data: function(exports, require, module, __filename, __dirname) {

    var Sprite = require('sprite');
    var EventEmitter = window.EventEmitter;

    /**
     * Initialize a new 'Entity' with the given 'opts'.
     * Entity inherits EventEmitter
     *
     * @param {Object} opts
     * @api public
     */
    function Entity(opts) {
      EventEmitter.call(this);
      this.entityId = opts.entityId;
      this.kindId = opts.kindId;
      this.kindName = opts.kindName;

      //position
      this.x = opts.x;
      this.y = opts.y;

      //global object 
      this.scene = opts.scene;
      this.map = opts.map;

      this.sprite = new Sprite(this);
    }

    Entity.prototype = Object.create(EventEmitter.prototype);
    module.exports = Entity;

    //Set position
    Entity.prototype.setPosition = function(x, y) {
      this.x = x;
      this.y = y;
    };

    //Get position
    Entity.prototype.getPosition = function() {
      return {x: this.x, y: this.y};
    };

    //Get sprite
    Entity.prototype.getSprite = function() {
      return this.sprite;
    };
    /**
     * Destory entity. when the entity is killed or removed, it is invoke. 
     * 
     * @api public
     */
    Entity.prototype.destory = function() {
      this.sprite.destory();
    };

    /**
     * set value of property
     * 
     * @param {String} property
     * @param {Object} value
     * @api public 
     */
    Entity.prototype.set = function(property, value) {
      this[property] = value;
      this.emit('change');
      this.emit('change:' + property);
    };
  }
};

