__resources__["/msgHandler.js"] = {
  meta: {mimetype: "application/javascript"},
  data: function(exports, require, module, __filename, __dirname) {

    var pomelo = window.pomelo;
    var app = require('app');
    //var dataApi = require('dataApi');
    var Border = require('consts').Border;
    //var noEntityNode = require('noEntityNode');
    var EntityType = require('consts').EntityType;
    var NodeCoordinate = require('consts').NodeCoordinate;
    var utils = require('utils');
    var clientManager = require('clientManager');

    exports.init = init;

    function init() {
      // add entities
      pomelo.on('addEntities', function(data) {
        var entities = data.entities;
        var area = app.getCurArea();
        if (!area) {
          return;
        }
        for (var i = 0; i < entities.length; i++) {
          var entity = area.getEntity(entities[i].entityId);
          if (!entity) {
            area.addEntity(entities[i]);
          }
        }
      });

      //Handle remove entities message
      pomelo.on('removeEntities', function(data) {
        var entities = data.entities;
        var area = app.getCurArea();
        var player = area.getCurPlayer();
        for (var i = 0; i < entities.length; i++) {
          if (entities[i] != player.entityId) {
            area.removeEntity(entities[i]);
          } else {
            console.log('entities[i], player.entityId', entities[i], player.entityId);
            console.error('remove current player!');
          }
        }
      });

      // Handle move  message
      pomelo.on('onMove', function(data) {
        var path = data.path;
        var entity = app.getCurArea().getEntity(data.entityId);
        if (!entity) {
          console.error('no character exist for move!' + data.entityId);
          return;
        }

        var sprite = entity.getSprite();
        var sPos = sprite.getPosition();
        //var totalDistance = utils.totalDistance(path);
        //var needTime = Math.floor(totalDistance / sprite.getSpeed() * 1000 - app.getDelayTime());
        //var speed = totalDistance/needTime * 1000;
        sprite.movePath([sPos, data.endPos]);
      });

      // Handle player drop items message
      pomelo.on('onDropItems', function(data) {
        var items = data.dropItems;
        var area = app.getCurArea();
        for (var i = 0; i < items.length; i ++) {
          area.addEntity(items[i]);
        }
      });

      // Handle remove item message
      pomelo.on('onRemoveItem', function(data) {
        app.getCurArea().removeEntity(data.entityId);
      });

      // Handle pick item message
      pomelo.on('onPickItem', function(data) {
        var area = app.getCurArea();
        var player = area.getEntity(data.entityId);
        var item = area.getEntity(data.target);
        player.treasureCount = data.treasureCount;
        player.getSprite().updateName(player.name + ' - ' + player.treasureCount);
        area.removeEntity(item.entityId);
      });

      // Handle kick out messge, occours when the current player is kicked out
      pomelo.on('onKick', function() {
        console.log('You have been kicked offline for the same account logined in other place.');
        app.changeView("login");
      });

      // Handle disconect message, occours when the client is disconnect with servers
      pomelo.on('disconnect', function(reason) {
        app.changeView("login");
      });

      // Handle user leave message, occours when players leave the area
      pomelo.on('onUserLeave', function(data) {
        var area = app.getCurArea();
        var playerId = data.playerId;
        console.log('onUserLeave invoke!');
        area.removePlayer(playerId);
      });

    }

    /**
     * the action invokes when the result is success
     * @param {Object} data
     */
    var successAction = function(data) {
      new skillEffect(data.skillEffectParams).createEffectAni();
      var attackerSprite = data.attackerSprite;
      var attackerPos = data.attackerPos;
      data.attackerSprite.translateTo(data.attackerPos.x, data.attackerPos.y);
      data.attackerSprite.attack({x1: data.attackerPos.x, y1: data.attackerPos.y, x2: data.targetPos.x, y2: data.targetPos.y});
      data.target.update({damage: data.resultData.damage});
      data.attacker.update({mpUse: data.resultData.mpUse});
      data.targetSprite.reduceBlood();
      data.targetSprite.createNumberNodes(data.resultData.damage);
    };

    var uiUpdate = function() {
      var player = app.getCurPlayer();
      player.emit('change:hp');
      player.emit('change:maxHp');
      player.emit('change:mp');
      player.emit('change:maxMp');
      player.emit('change:experience');
    };
  }
};

