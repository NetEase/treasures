__resources__["/sprite.js"] = {
  meta: {mimetype: "application/javascript"},
  
  data: function(exports, require, module, __filename, __dirname) {
    var pomelo = window.pomelo;
    var Node = require('node').Node;
    var animate = require('animate');
    var SequenceAnimation = require('animate').SequenceAnimation;
    var model = require('model');
    var FrameSeqComponent = require('component').FrameSeqComponent;
    var FrameAnimation = require('frameanimation').FrameAnimation;
    var imgAndJsonUrl = require('config').IMAGE_URL;
    var aniName = require('consts').AnimationName;
    var aniOrientation = require('consts').Orientation;
    var Border = require('consts').Border;
    var EntityType = require('consts').EntityType;
    var NodeCoordinate = require('consts').NodeCoordinate;
    var consts = require('consts');
    var utils = require('utils');
    var dataApi = require('dataApi');
    var noEntityNode = require('noEntityNode');
    var animation = require('animation');

    var app = require('app');

    /**
     * Initialize a new 'Sprite' with the given 'opts'.
     * the sprite of entity, each entity own one sprite, sprite own only node, the node can have many animations
     *
     * @param {object} opts  instante the object sprite
     * @api public
     */
    function Sprite(opts) {
      this.entity = opts;
      this.mapNode = this.entity.map.node;
      this.curNode = null;
      this.bloodbarNode = null;

      this.moveAnimation = null;
      this.standAnimation = null;
      this.standFrameLoop = null;
      this.walkAnimation = null;
      this.walkFrameLoop = null;
      this._init();
    }

    module.exports = Sprite;

    /**
     * Init the node and animation according to entity's type.
     *
     * @api private
     */
    Sprite.prototype._init = function() {
      var name = aniName.LEFT_STAND, startAin = 'Stand';
      var npcName = aniOrientation.LEFT;
      var type = this.entity.type;
      if (type === EntityType.PLAYER) {
        this._initDynamictNode(aniOrientation.LEFT+startAin);
      } else if (type === EntityType.TREASURE) {
        this._initStaticNode();
      }
    };

    /**
     * Init static Node. static node is static and contains npc, item, and equipment node.
     *
     * @api private
     */
    Sprite.prototype._initStaticNode = function() {
      var ResMgr = app.getResMgr();
      var x = this.entity.x, y = this.entity.y;
      var staticImg = null;
      switch(this.entity.type) {
        case EntityType.ITEM:
          staticImg = ResMgr.loadImage(imgAndJsonUrl + 'item/' + this.entity.imgId + '.png');
        break;
        case EntityType.TREASURE:
          staticImg = ResMgr.loadImage(imgAndJsonUrl + 'equipment/60/' + this.entity.imgId + '.png');
        break;
      }
      var staticModel = new model.ImageModel({
        image: staticImg		
      });
      staticModel.set('ratioAnchorPoint', {
        x: 0.5,
        y: 0.5
      });
      var staticNode = this.entity.scene.createNode({
        model: staticModel
      });
      staticNode.id = this.entity.entityId;
      this.entity.scene.addNode(staticNode, this.mapNode);
      staticNode.exec('translate', x, y, NodeCoordinate.NPC_NODE);
      var nameNode = noEntityNode.createNameNode(this.entity);
      nameNode.exec('translate', 0, -50, NodeCoordinate.NPC_NODE);
      this.entity.scene.addNode(nameNode, staticNode);
      this.curNode = staticNode;
    };

    /**
     * Init dynamic Node. dynamic node is not static and contains player, mob node.
     *
     * @param {String} name, animation orientation
     * @api private
     */
    Sprite.prototype._initDynamictNode = function(name) {
      var frameNode = this.entity.scene.createNode({});
      frameNode.id = this.entity.entityId;
      this.entity.scene.addNode(frameNode, this.mapNode);
      var position = this.getPosition();
      var x = position.x, y = position.y, z = position.z;
      if (this.curNode) {
        this.mapNode.removeChild(this.curNode);
      } else {
        x = this.entity.x;
        y = this.entity.y;
      }
      frameNode.exec('translate', x, y, NodeCoordinate.PLAYER_NODE);
      this.curNode = frameNode;
      this.nameNode = noEntityNode.createNameNode(this.entity);
      this.entity.scene.addNode(this.nameNode, frameNode);
      if (this.entity.type === EntityType.PLAYER) {
        this.nameNode.exec('translate', 0 , -120, NodeCoordinate.NAME_NODE);
      }
      this._initStand();
    };

    //Update entity' name.
    Sprite.prototype.updateName = function(text) {
      this.nameNode.model().text = text;
    };

    /**
     * Action makes up animation.
     * 
     * @param {Object} dir, orientation of action
     * @param {String} actionName, the name of action
     * @param {Function} cb
     * @api private
     */
    Sprite.prototype._action = function(dir, actionName, callback) {
      if (!this.curNode) {
        return;
      }
      if (typeof(dir) === 'undefined') {
        dir = {x1:0, y1: 0, x2:1, y2: 1};
      }
      var dr = utils.calculateDirection(dir.x1, dir.y1, dir.x2, dir.y2);
      var orientation = dr.orientation;
      var flipX = dr.flipX;
      if (!!this.curNode) {
        var ori;
        if (orientation && orientation === aniOrientation.LEFT) {
          ori = 'LEFT_' + actionName;
        } else if (orientation && orientation === aniOrientation.RIGHT) {
          ori = 'RIGHT_' + actionName;
        }
        var name = aniName[ori];
        var actionAnimation = null;
        if (this.entity.type === EntityType.PLAYER) {
          actionAnimation = new animation({
            kindId: this.entity.kindId,
            type: this.entity.type,
            name: name,
            flipx: flipX
          }).create();
        }
        var actionModel = actionAnimation.target();
        actionModel.set('ratioAnchorPoint', {
          x: 0.5,
          y: 0.8
        });
        this.curNode.setModel(actionModel);
        var self = this;
        if (actionName === 'WALK' || actionName === 'STAND') {
          var loopAnimation = animate.times(actionAnimation, Infinity);
          this.curNode.exec('addAnimation', loopAnimation);
          return {
            actionAnimation: actionAnimation,
            loopAnimation: loopAnimation
          };
        } 
        actionAnimation.onFrameEnd = function(t, dt) {
          if (self.curNode && actionAnimation.isDone()) {
            callback();
            actionAnimation = null;
          }
        }
        this.curNode.exec('addAnimation', actionAnimation);
        return actionAnimation;
      }
    };

    //Walk animation, one of four basic animations.
    Sprite.prototype.walk = function(dir) {
      this.stopWholeAnimations();
      var result = this._action(dir, 'WALK');
      this.walkAnimation = result.actionAnimation;
      this.walkFrameLoop = result.loopAnimation;
    };

    //Stop walkAnimation
    Sprite.prototype.stopWalk = function() {
      if (!this.curNode || !this.walkAnimation || !this.walkFrameLoop) {
        return;
      }

      this.removeAnimation(this.walkAnimation);
      this.removeAnimation(this.walkFrameLoop);
      this.walkAnimation = null;
      this.walkFrameLoop = null;
    };

    //Stand animation, one of four basic animation.
    Sprite.prototype.stand = function(dir) {
      this.stopWholeAnimations();
      this._initStand(dir);
    };

    //Initialized animation
    Sprite.prototype._initStand = function(dir) {  
      var result = this._action(dir, 'STAND');
      this.standAnimation = result.actionAnimation;
      this.standFrameLoop = result.loopAnimation;
    };

    //Stop standAnimation
    Sprite.prototype.stopStand = function() {
      if (!this.curNode || !this.standAnimation || !this.standFrameLoop) {
        return;
      }

      this.removeAnimation(this.standAnimation);
      this.removeAnimation(this.standFrameLoop);
      this.standAnimation = null;
      this.standFrameLoop = null;
    };

    /**
     * StopWholeAnimations, contains stopMove, stopStand, stopAttack
     * the all animations will be freezed
     *
     * @api public
     */
    Sprite.prototype.stopWholeAnimations = function() {
      this.stopMove();
      this.stopStand();
    };

    /**
     * Make the sprite move around with the path.
     *
     * @param path {Array} array of points that describe a path
     * @api public
     */
    Sprite.prototype.movePath = function(path, speed) {
      if (!speed) {
        speed = this.getSpeed();
      }
      if (!this.curNode) {
        return;
      }
      if (!path || path.length <= 1) {
        console.error('invalid path: ' + path);
        return;
      }

      this.stopWholeAnimations();
      this.clearPath();

      this.curPath = path;
      this.leftDistance = utils.totalDistance(path);
      if (!this.leftDistance) {
        return;
      }
      this.leftTime = Math.floor(this.leftDistance / speed * 1000);
      // a magic accelerate...
      if (this.leftTime > 10000) {
        this.leftTime -= 200;
      }

      this._movePathStep(1);
    };

    Sprite.prototype.getSpeed = function() {
      return this.entity.walkSpeed;
    };

    /**
     * Stop move and clear current moving path
     */
    Sprite.prototype.clearPath = function() {
      this.stopMove();
      this.curPath = null;
      this.leftDistance = 0;
      this.leftTime = 0;
    };

    /**
     * Move the path step.
     * Stand and clear current path if move finish
     *
     * @param index {Number} index of step in the path
     */
    Sprite.prototype._movePathStep = function(index) {
      if(!this._checkPathStep(index)) {
        return;
      }

      if(index === 0) {
        index = 1;
      }

      var start = this.curPath[index - 1];
      var end = this.curPath[index];
      var distance = utils.distance(start.x, start.y, end.x, end.y);
      var time = Math.floor(this.leftTime * distance / this.leftDistance) || 1;
      var self = this;

      this._move(start.x, start.y, end.x, end.y, time, function(dt) {
        index++;
        self.leftDistance -= distance;
        self.leftTime -= dt;
        if(self.leftTime <= 0) {
          self.leftTime = 1;
        }

        if(self._checkPathStep(index)) {
          self._movePathStep(index); 
          return;
        }
        self.stopWholeAnimations();
        self.clearPath();
        self.stand({x1: start.x, y1: start.y, x2: end.x, y2: end.y});
      });
    };

    Sprite.prototype._move = function(sx, sy, ex, ey, time, cb) {
      this.stopMove();
      this.moveAnimation = new animate.MoveTo(
        [0, {x: sx, y: sy}, 'linear'],
        [time, {x: ex, y: ey}, 'linear']
      );
      this.walk({x1: sx, y1: sy, x2: ex, y2: ey});
      var self = this;
      this.moveAnimation.regCB(1, function() {
        utils.invokeCallback(cb, Date.now() - startTime);
      });

      if(this.isCurPlayer()) {
        this.entity.map.moveBackground({x: ex, y: ey}, time);
      }

      var startTime = Date.now();
      this.curNode.exec('addAnimation', this.moveAnimation);
    };

    Sprite.prototype._checkPathStep = function(index) {
      return this.leftDistance > 0 && this.curPath && index < this.curPath.length;
    };

    Sprite.prototype.isMove = function() {
      return (!!this.moveAnimation) && (!this.moveAnimation.isDone());
    };

    //remove the animation of the curNode
    Sprite.prototype.removeAnimation = function(animation) {
      if (animation) {
        this.curNode.exec('removeAnimation', animation.identifier);
      }
    };

    //Stop moveAnimation
    Sprite.prototype.stopMove = function() {
      this.walkName = null;
      this.walkFlipX = null;
      if(this.isCurPlayer()) {
        this.entity.map.stopMove();
      }
      this.removeAnimation(this.moveAnimation);
      this.stopWalk();
    };


    // Get sprite position
    Sprite.prototype.getPosition = function() {
      if (this.curNode) {
        return this.curNode._component.matrix._matrix._position;
      } else {
        return {
          x: 0,
          y: 0,
          z: 0
        };
      }
    };
    //Get map position
    Sprite.prototype.getMapPosition = function() {
      if (this.curNode && this.curNode._parent) {
        return this.curNode._parent._component.matrix._matrix._position;
      } else {
        return {
          x: 0,
          y: 0,
          z: 0
        };
      }
    };

    /**
     * Destory node, when the entity is killed or disappear, it's node and all the animations should be removed.
     *
     * @api public
     */
    Sprite.prototype.destory = function() {
      this.stopWholeAnimations();
      if (this.curNode) {
        this.mapNode.removeChild(this.curNode);
        if (this.entity.type !== EntityType.PLAYER) {
          this.curNode = null;
        }
      }
    };

    //Check out the curPlayer
    Sprite.prototype.isCurPlayer = function() {
      return !!this.entity && this.entity.entityId === app.getCurArea().getCurPlayer().entityId;
    };

    //Translate to another position
    Sprite.prototype.translateTo = function(x, y) {
      this.curNode.exec('translate', x, y, NodeCoordinate.PLAYER_NODE);
    };
  }
};


