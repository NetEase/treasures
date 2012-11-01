__resources__["/clientManager.js"] = {
	meta: { mimetype: "application/javascript" },

	data: function(exports, require, module, __filename, __dirname) {
		var pomelo = window.pomelo;
		var app = require('app');
		var EntityType = require('consts').EntityType;
		//var utils = require('utils');

    // checkout the moveAimation
    function move(targetPos) {
      pomelo.request({route: 'area.playerHandler.move', targetPos: targetPos}, function(result) {
        if (result.code == 200) {
          
          var sprite = app.getCurPlayer().getSprite();
          var sPos = result.sPos;
          console.log(result);
					sprite.translateTo(sPos.x, sPos.y);
        }else {
          console.warn('curPlayer move error!');
        }
      });
      // sprite.movePath(paths.path);
    }


    //暴露的接口和对象
    exports.move = move;
  }
};



