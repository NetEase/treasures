__resources__["/clientManager.js"] = {
	meta: { mimetype: "application/javascript" },

	data: function(exports, require, module, __filename, __dirname) {
		//var clientManager = require('Manager');

		var pomelo = window.pomelo;
		var app = require('app');
		var EntityType = require('consts').EntityType;
		var gameMsgHandler = require('msgHandler');
    //var switchManager = require('switchManager'); //切换管理
    var clientManager = require('clientManager'); //切换管理
    //var dataApi = require('dataApi');
    //var ResourceLoader = require('resourceLoader');
		var utils = require('utils');
    var config = require('config');

    var alert = window.alert;
		var self = this;


		function init() {
      
		}

    function afterLogin(data) {
      var userData = data.user;
      var playerData = data.player;

      var areaId = playerData.areaId;
      var areas = {1: {map: {id: 'jiangnanyewai.png', width: 3200, height: 2400}, id: 1}};

      if (!!userData) {
        pomelo.uid = userData.id;
      }
      pomelo.playerId = playerData.id;
      pomelo.areaId = areaId;
      pomelo.player = playerData;
      loadResource({jsonLoad: true}, function() {
        enterScene();
      });
    }


    function loadResource(opt, callback) {
      switchManager.selectView("loadingPanel");
      var loader = new ResourceLoader(opt);
      var $percent = $('#id_loadPercent').html(0);
      var $bar = $('#id_loadRate').css('width', 0);
      loader.on('loading', function(data) {
        var n = parseInt(data.loaded * 100 / data.total);
        $bar.css('width', n + '%');
        $percent.html(n);
      });
      loader.on('complete', function() {
        if (callback) {
          setTimeout(function(){
            callback();
          }, 500);
        }
      });

      loader.loadAreaResource();
    }

    function enterScene(){
      pomelo.request({route:"area.playerHandler.enterScene", uid:pomelo.uid, playerId: pomelo.playerId, areaId: pomelo.areaId},function(data){
        app.init(data.data);
      });
    }

    // checkout the moveAimation
    function move(args) {
      var path = [{x: args.startX, y: args.startY}, {x: args.endX, y: args.endY}];
      var map = app.getCurArea().map;
      var paths = map.findPath(args.startX, args.startY, args.endX, args.endY);
      if (!paths || !paths.path) {
        return;
      }
      var curPlayer = app.getCurArea().getCurPlayer();	

      var area = app.getCurArea();
      var sprite = curPlayer.getSprite();
			var totalDistance = utils.totalDistance(paths.path);
			var needTime = Math.floor(totalDistance / sprite.getSpeed() * 1000 + app.getDelayTime());
			var speed = totalDistance / needTime * 1000;
      sprite.movePath(paths.path, speed);
      pomelo.request({route: 'area.playerHandler.move', path: paths.path}, function(result) {
        if (result.code != 200) {
          console.warn('curPlayer move error!');
					sprite.translateTo(paths.path[0].x, paths.path[0].y);
        }
      });
      sprite.movePath(paths.path);
    }

    function launchAi(args) {
      var areaId = pomelo.areaId;
      var playerId = pomelo.playerId;
      var targetId = args.id;
      if (pomelo.player.entityId === targetId) {
        return;
      }
      var skillId = pomelo.player.curSkill;
      var area = app.getCurArea();
      var entity = area.getEntity(targetId);
      if (entity.type === EntityType.PLAYER || entity.type === EntityType.MOB) {
        if (entity.died) {
          return;
        }
        pomelo.notify({route: 'area.fightHandler.attack', areaId :areaId, playerId: playerId, targetId: targetId, skillId: skillId });
      } else if (entity.type === EntityType.NPC) {
        pomelo.notify({route: 'area.playerHandler.npcTalk', areaId :areaId, playerId: playerId, targetId: targetId});
      } else if (entity.type === EntityType.ITEM || entity.type === EntityType.EQUIPMENT) {
        pomelo.notify({route: 'area.playerHandler.pickItem', areaId :areaId, playerId: playerId, targetId: targetId});
      }
    }

    /**
     * amend the path of addressing
     * @param {Object} path   the path of addressing
     * @return {Object} path the path modified
     */
    function pathAmend(path) {
      var pathLength = path.length;
      for (var i = 0; i < pathLength-2; i ++) {
        var curPoint = path[i];
        var nextPoint = path[i+1];
        var nextNextponit = path[i+2];
        if (curPoint.x === nextPoint.x) {
          if (nextNextponit.x > nextPoint.x) {
            nextPoint.x += 1;
          } else {
            nextPoint.x -= 1;
          }
          path[i+1] = nextPoint;
        }
        if (curPoint.y === nextPoint.y) {
          if (nextNextponit.y > nextPoint.y) {
            nextPoint.y += 1;
          }else {
            nextPoint.y -= 1;
          }
          path[i+1] = nextPoint;
        }
      }
      return path;
    }


    //暴露的接口和对象
    exports.init = init;
    //exports.register = register;
    exports.enterScene = enterScene;
    exports.move = move;
    exports.loadResource = loadResource;
    exports.launchAi = launchAi;

  }
};



