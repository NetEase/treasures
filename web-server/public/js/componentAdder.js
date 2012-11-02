__resources__["/componentAdder.js"] = {
  meta: { mimetype: "application/javascript"},
  data: function(exports, require, module, __filename, __dirname) {

    var MouseButtonEventComponent = require('component').MouseButtonEventComponent;
    var clientManager = require('clientManager');
    var HoverEventComponent = require('component').HoverEventComponent;
    /**
     * add component to entity, such as mouseButtonEventComponent
     */
    var ComponentAdder = function(opts) {
      var area = opts.area;
      this.addComponent = function(){
        addClickComponent();
      };

      this.addComponentTo = function(entity) {
        addComponentToEntity(entity);
      };

      /**
       * add clickComponet to map
       */
      var addClickComponent = function() {
        var clickComponentPlayer = new MouseButtonEventComponent({
          pipe: area.gLevel.sysPipe(),
          decider: area.scene.queryDecider('mouseButtonDecider'),
          callback: move
        });

        area.map.node.addComponent('mouseButtonEventComponent', clickComponentPlayer);
      };
      var move = function(event) {
        var player = area.getCurPlayer();
        var sprite = player.getSprite();
        if (event.type === 'mousePressed'){
          var endX = event.mouseX - sprite.getMapPosition().x;
          var endY = event.mouseY - sprite.getMapPosition().y;
          /*
          var startX = sprite.getPosition().x;
          var startY = sprite.getPosition().y;
          var moveMessage = {
            startX: startX,
            startY: startY,
            endX: endX,
            endY: endY,
            playerId: player.id,
            areaId: area.id,
            speed: sprite.entity.walkSpeed
          };
          */
          clientManager.move({x: endX, y: endY});
        }
      };

      /**
       * add mouseClick component to entity
       * @param {Object} entity
       */
      var addComponentToEntity = function(entity) {
        //add mouseButtonEvent to entities
        var clickComponentEntity = new MouseButtonEventComponent({
          pipe: area.gLevel.sysPipe(),
          decider: area.scene.queryDecider('mouseButtonDecider'),
          callback: launchAi
        });
        var node = entity.getSprite().curNode;
        node.addComponent('mouseButtonEventComponent', clickComponentEntity);
        //add HoverEventComponent to entities
      };

      //TODO
      var launchAi = function (event, node) {
        if (event.type === 'mouseClicked') {
          clientManager.pick({id: node.id});
        }
      };

    };
    module.exports = ComponentAdder;
  }
};


