__resources__["/clientManager.js"] = {
	meta: { mimetype: "application/javascript" },

	data: function(exports, require, module, __filename, __dirname) {
		var pomelo = window.pomelo;
		var app = require('app');
		var EntityType = require('consts').EntityType;

    function move(targetPos) {
      pomelo.request('area.playerHandler.move', {targetPos: targetPos}, function(result) {
        if (result.code == 200) {
          // var sprite = app.getCurPlayer().getSprite();
          // var sPos = result.sPos;
					// sprite.translateTo(sPos.x, sPos.y);
        } else {
          console.warn('curPlayer move error!');
        }
      });
    }

    function pick(args) {
      var targetId = args.id;
      var entity = app.getCurArea().getEntity(targetId);
     
      if (entity.type === EntityType.TREASURE) {
        pomelo.request('area.playerHandler.move', {targetPos: {x: entity.x, y: entity.y}, target: targetId});
      }
    }

    exports.move = move;
    exports.pick = pick;
  }
};



