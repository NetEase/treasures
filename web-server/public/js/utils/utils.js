__resources__["/utils.js"] = {meta: {mimetype: "application/javascript"}, data: function(exports, require, module, __filename, __dirname) {

  var aniOrientation = require('consts').aniOrientation;

  module.exports.distance = function(sx, sy, ex, ey) {
    var dx = ex - sx;
    var dy = ey - sy;

    return Math.sqrt(dx * dx + dy * dy);
  };

  module.exports.totalDistance = function(path) {
    if(!path || path.length < 2) {
      return 0;
    }

    var distance = 0;
    for(var i=0, l=path.length-1; i<l; i++) {
      distance += this.distance(path[i].x, path[i].y, path[i + 1].x, path[i + 1].y);
    }

    return distance;
  };

  module.exports.invokeCallback = function(cb) {
    if(cb && typeof cb === 'function') {
      cb.apply(null, Array.prototype.slice.call(arguments, 1));
    }
  };

  /**
   * calculate the direction
   * if move, x1, y1 are the startPosition, x2, y2 are the endPosotion
   * else, x1, y1 are the curNode position, x2, y2 are the target position
   */
  module.exports.calculateDirection = function(x1, y1, x2, y2) {
    var distX = x2 - x1
      , distY = y2 - y1
      , orientation;

    if (distX >= 0 && distY < 0) {//quadrant 1

      orientation = aniOrientation.RIGHT_UP;

    } else if (distX < 0 && distY < 0) {//quadrant 2

      orientation = aniOrientation.LEFT_UP;

    } else if (distX <0 && distY >= 0) {//quadrant 3

      orientation = aniOrientation.LEFT_DOWN;

    } else {//quadrant 4

      orientation = aniOrientation.RIGHT_DOWN;
    }
    return orientation;
  };
}
};

