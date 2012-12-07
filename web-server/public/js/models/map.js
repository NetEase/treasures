__resources__["/map.js"] = {
  meta: {mimetype: "application/javascript"}, 
  data: function(exports, require, module, __filename, __dirname) {

    var helper = require("helper");
    var pomelo = window.pomelo;
    var model = require('model');
    var animate = require('animate');
    var	buildMap = require('tiled_map').buildMap;
    var app = require('app');
    var url = require('config').IMAGE_URL;

    var Map = function(opts) {
      this.data = null;
      this.node = null;
      this.name = opts.name;
      this.scene = opts.scene;
      this.initPos = opts.pos;
      this.width = opts.width;
      this.height = opts.height;
      this.moveAnimation = null;
    
      this.loadMap();
    };

    var pro = Map.prototype;

   
    pro.loadMap = function() {
      var pos = this.initPos;
      var mapUrl = url + 'map/' + 'oasis-mini.jpg'

      var mapImage = helper.loadImage(mapUrl);

      var imgModel = new model.ImageModel({
        image: mapImage
      });

      imgModel.image.style = "-webkit-transform:translate3d(0,0,0)"
      var node = this.scene.createNode({
        model: imgModel
      });

      node.exec('translate', -pos.x, -pos.y, -1);

      this.scene.addNode(node);
      this.node = node;
    };

    pro.move = function(distX, distY, speed) {
      if(!this.node) {
        return;    }
        this.stopMove();
        var position = this.position();
        var endX = position.x + distX;
        var endY = position.y + distY;

        var distance = Math.sqrt(distX * distX + distY * distY);
        var timeNum = (distance / speed) * 1000;
        this.moveAnimation = new animate.MoveTo(
          [0, {x: position.x, y: position.y}, 'linear'],
          [timeNum, {x: endX, y: endY}, 'linear']
        );

        var self = this;
        this.moveAnimation.onFrameEnd = function(t, dt) {
          var pos = self.position();
          var success = self.checkMapBoundary(distX, distY, pos);
          if (success || self.moveAnimation.isDone()) {
            self.stopMove();
          }
        };
        this.node.exec('addAnimation', this.moveAnimation);
    };

    pro.isMove = function() {
      return !!this.moveAnimation;
    };

    pro.centerTo = function(x, y) {
      if(!this.node) {
        return;
      }
      var width = getScreenWidth();
      var height = getScreenHeight();
      var maxX = this.width - width - 10;
      var maxY = this.height - height - 10;
      x = x - width / 2;
      y = y - height / 2;
      if(x < 0) {
        x = 0;
      } else if(x > maxX) {
        x = maxX;
      }
      if(y < 0) {
        y = 0;
      } else if(y > maxY) {
        y = maxY;
      }
      this.node.exec('translate', -x, -y, -1);
    };

    /**
     * Move the background with the current player sprite.
     *
     * @param sdist {Object} sprite move distination {x, y}
     * @param time {Number} sprite move time
     */
    pro.moveBackground = function(sdist, time) {
      if(!this.node) {
        return;
      }
      this._checkPosition(sdist, time);
    };

    /**
     * Move the background in the x direction
     *
     * @param dx {Number} move distance. positive: to right, negative: to left
     * @param time {Number} move time
     * @param sdist {Object} sprite distination {x, y}
     */
    pro._moveX = function(dx, time, sdist) {
      this.stopMove();

      var position = this.position();
      var ex = position.x + dx;
      var ey = position.y;

      var self = this;
      this._move(position.x, position.y, ex, ey, time, function(t, dt) {
        self._checkPosition(sdist, time - self.moveAnimation.elapsed(), true, false);
      });
    };

    /**
     * Move the background in the y direction
     *
     * @param dy {Number} move distance. positive: to bottom, negative: to top
     * @param time {Number} move time
     * @param sdist {Object} sprite distination {x, y}
     */
    pro._moveY = function(dy, time, sdist) {
      this.stopMove();

      var position = this.position();
      var ex = position.x;
      var ey = position.y + dy;

      var self = this;
      this._move(position.x, position.y, ex, ey, time, function(t, dt) {
        self._checkPosition(sdist, time - self.moveAnimation.elapsed(), false, true);
      });
    };

    /**
     * Move the background in both x and y directions and the same time
     *
     * @param dx {Number} move distance. positive: to right, negative: to left
     * @param dy {Number} move distance. positive: to bottom, negative: to top
     * @param time {Number} move time
     * @param sdist {Object} sprite distination {x, y}
     */
    pro._moveAll = function(dx, dy, time, sdist) {
      this.stopMove();

      var position = this.position();
      var ex = position.x + dx;
      var ey = position.y + dy;

      var self = this;
      this._move(position.x, position.y, ex, ey, time, function(t, dt) {
        self._checkPosition(sdist, time - self.moveAnimation.elapsed(), true, true);
      });
    };

    /**
     * The background keep still and just wait the frame end callback
     *
     * @param time {Number} move time
     * @param sdist {Object} sprite distination {x, y}
     */
    pro._stand = function(time, sdist) {
      this.stopMove();

      var mpos = this.position();

      var self = this;
      this._move(mpos.x, mpos.y, mpos.x, mpos.y, time, function(t, dt) {
        self._checkPosition(sdist, time - self.moveAnimation.elapsed(), false, false);
      });
    };

    /**
     * Move the background from {sx, sy} to {ex, ey} within the time
     *
     * @param sx {Number} start x
     * @param sy {Number} start y
     * @param ex {Number} end x
     * @param ey {Number} end y
     * @param time {Number} move time
     * @param onFrameEnd {Function} callback for each frame end
     */
    pro._move = function(sx, sy, ex, ey, time, onFrameEnd) {
      this.moveAnimation = new animate.MoveTo(
        [0, {x: sx, y: sy}, 'linear'],
        [time, {x: ex, y: ey}, 'linear']
      );

      var self = this;
      if(onFrameEnd) {
        this.moveAnimation.onFrameEnd = onFrameEnd;
      }

      this.node.exec('addAnimation', this.moveAnimation);
    };

    /**
     * Check the position of sprite and map and deside whether to move the background
     *
     * @param sdist {Object} sprite distination {x, y}
     * @param time {Number} move time
     * @param osx {Boolean} old should move x flag
     * @param osy {Boolean} old should move y flag
     */
    pro._checkPosition = function(sdist, time, osx, osy) {
      var mpos = this.position();
      var spos = getCurPlayer().getSprite().getPosition();
      var dx = spos.x - sdist.x;
      var dy = spos.y - sdist.y;

      var sx = shouldMoveX(spos, mpos, dx, this.width);
      var sy = shouldMoveY(spos, mpos, dy, this.height);

      if(osx === sx && osy === sy) {
        // if the status is the same the origin one then nothing need to change
        return;
      }

      if(sx && sy) {
        // we should move both in x and y direction
        this._moveAll(dx, dy, time, sdist);
        return;
      }

      if(!sx && !sy) {
        // just stand
        this._stand(time, sdist);
        return;
      }

      if(sx) {
        // move in x direction
        this._moveX(dx, time, sdist);
        return;
      }

      // move in y direction
      this._moveY(dy, time, sdist);
    };

    /**
     * Check whether the map can move in x direction
     *
     * @param pos {Object} map position {x, y}
     * @param dx {Number} move direction. position means map move to the right and negative means move to the left and zero means no need to move in x direction.
     */
    var canMoveX = function(pos, dx, width) {
      if(dx === 0) {
        return false;
      }

      if(dx > 0) {
        return !mapInLeft(pos, width);
      }

      return !mapInRight(pos, width, getScreenWidth());
    };

    /**
     * Check whether the map can move in y direction
     *
     * @param pos {Object} map position {x, y}
     * @param dy {Number} move direction. position means map move to the bottom and negative means move to the top and zero means no need to move in y direction.
     */
    var canMoveY = function(pos, dy, height) {
      if(dy === 0) {
        return false;
      }

      if(dy > 0) {
        return !mapInTop(pos, height);
      }

      return !mapInBottom(pos, height, getScreenHeight());
    };

    /**
     * Check whether the map should move in x direction. If the spite not in the middle of the screen and the map can move then it should move.
     *
     * @param spritePos {Object} sprite position {x, y}
     * @param mapPos {Object} map position {x, y}
     * @param dx {Number} map move direction. position means map move to the right and negative means move to the left and zero means no need to move in x direction.
     */
    var shouldMoveX = function(spritePos, mapPos, dx, mapWidth) {
      var cx = canMoveX(mapPos, dx, mapWidth);
      if(!cx) {
        return false;
      }

      if(dx > 0) {
        return !spriteInRight(spritePos, mapPos, mapWidth);
      } else {
        return !spriteInLeft(spritePos, mapPos, mapWidth);
      }
    };

    /**
     * Check whether the map should move in y direction. If the spite not in the middle of the screen and the map can move then it should move.
     *
     * @param spritePos {Object} sprite position {x, y}
     * @param mapPos {Object} map position {x, y}
     * @param dy {Number} map move direction. position means map move to the bottom and negative means move to the top and zero means no need to move in y direction.
     */
    var shouldMoveY = function(spritePos, mapPos, dy, mapHeight) {
      var cy = canMoveY(mapPos, dy, mapHeight);
      if(!cy) {
        return false;
      }

      if(dy > 0) {
        return !spriteInBottom(spritePos, mapPos, mapHeight);
      } else {
        return !spriteInTop(spritePos, mapPos, mapHeight);
      }
    };

    pro.stopMove = function() {
      if (this.isMove()) {
        this.node.exec('removeAnimation', this.moveAnimation.identifier);
      }
    };

    pro.position = function(){
      if (this.node) {
        return this.node._component.matrix._matrix._position;
      } else {
        return {
          x: 0,
          y: 0,
          z: 0
        };
      }
    };

    var getScreenWidth = function() {
      return parseInt(getComputedStyle(document.getElementById("game")).width, 10);
    };

    var getScreenHeight = function() {
      return parseInt(getComputedStyle(document.getElementById("game")).height, 10);
    };

    var mapInTop = function(mapPos, height) {
      return  mapPos.y >= -10;
    };

    var mapInLeft = function(mapPos, width) {
      return  mapPos.x >= -10;
    };

    var mapInBottom = function(mapPos, mapHeight, screenHeight) {
      return  (mapHeight + mapPos.y - screenHeight) <= 10;
    };

    var mapInRight = function(mapPos, mapWidth, screenWidth) {
      return  (mapWidth + mapPos.x - screenWidth) <= 10;
    };

    var spriteInTop = function(spritePos, mapPos) {
      return ((spritePos.y + mapPos.y) * 2 < getScreenHeight());
    };

    var spriteInLeft = function(spritePos, mapPos) {
      return ((spritePos.x + mapPos.x) * 2 < getScreenWidth());
    };

    var spriteInBottom = function(spritePos, mapPos) {
      return ((spritePos.y + mapPos.y) * 2 > getScreenHeight());
    };

    var spriteInRight = function(spritePos, mapPos) {
      return ((spritePos.x + mapPos.x) * 2 > getScreenWidth());
    };

    var getCurPlayer = function() {
      return app.getCurArea().getCurPlayer();
    };

    module.exports = Map;
  }
};

