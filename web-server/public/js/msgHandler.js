__resources__["msgHandler.js"] = {
  meta: {mimetype: "application/javascript"},
  data: function(exports, require, module, __filename, __dirname) {

    var pomelo = window.pomelo;
    var app = require('app');
    var dataApi = require('dataApi');
    var Border = require('consts').Border;
    var noEntityNode = require('noEntityNode');
    var EntityType = require('consts').EntityType;
    var NodeCoordinate = require('consts').NodeCoordinate;
    var utils = require('utils');
    var clientManager = require('clientManager');

    exports.init = init;

    function init() {

      /**
       * Handle change area message
       * @param data {Object} The message
       */
      pomelo.on('onChangeArea', function(data) {
        if(!data.success) {
          return;
        }
        clientManager.loadResource({jsonLoad: false}, function() {
          pomelo.areaId = data.target;
          pomelo.request({route:"area.playerHandler.enterScene", uid:pomelo.uid, playerId: pomelo.playerId, areaId: pomelo.areaId}, function(msg) {
            app.init(msg.data);
          });	
        });
      });

      /**
       * Handle add entities message
       * @param data {Object} The message, contains entities to add
       */
      pomelo.on('addEntities', function(data){
        var entities = data.entities;
        var area = app.getCurArea();
        if(!area)
          return;
        for(var i = 0; i < entities.length; i++){
          var entity = area.getEntity(entities[i].entityId);
          if(!entity){
            area.addEntity(entities[i]);
          }
        }
      });

      /**
       * Handle remove entities message
       * @param data {Object} The message, contains entitiy ids to remove
       */
      pomelo.on('removeEntities', function(data){
        var entities = data.entities;
        var area = app.getCurArea();
        var player = area.getCurPlayer();
        for(var i = 0; i < entities.length; i++){
          if(entities[i] != player.entityId)
            area.removeEntity(entities[i]);
          else {
            console.log('entities[i], player.entityId', entities[i], player.entityId);
            console.error('remove current player!');
          }
          //console.log('remove entity: ' + entities[i])
        }
      })

      /**
       * Handle move  message
       * @param data {Object} The message, contains move information
       */

      pomelo.on('onMove', function(data){
        var path = data.path;
        var character = app.getCurArea().getEntity(data.entityId);
        if(!character){
          console.error('no character exist for move!' + data.entityId);
          return;
        }

        var sprite = character.getSprite();
        var totalDistance = utils.totalDistance(path);
        var needTime = Math.floor(totalDistance / sprite.getSpeed() * 1000 - app.getDelayTime());
        var speed = totalDistance/needTime * 1000;
        sprite.movePath(path, speed);
      });

      pomelo.on('onPathCheckout', function(data) {
        var player = app.getCurArea().getEntity(data.entityId);
        var serverPosition = data.position;
        var clientposition = player.getSprite().getPosition();
        var realDistance = utils.distance(serverPosition.x, serverPosition.y, clientposition.x, clientposition.y);
        var distanceLimit = 100;


        if (realDistance > distanceLimit) {
          console.error('path checkout!!!');
          player.getSprite().translateTo(serverPosition.x, serverPosition.y);	
        }


      });


      /**
       * Handle player drop items message
       * @param data {Object} The message, contains items to add in the area
       */
      pomelo.on('onDropItems' , function(data) {
        var items = data.dropItems;
        var area = app.getCurArea();
        for (var i = 0; i < items.length; i ++) {
          area.addEntity(items[i]);
        }
      });


      /**
       * Handle remove item message
       * @param data {Object} The message, contains the info for remove item
       */
      pomelo.on('onRemoveItem', function(data){
        app.getCurArea().removeEntity(data.entityId);
      });

      /**
       * Handle pick item message
       * @param data {Object} The message, contains the info for pick item
       */
      pomelo.on('onPickItem', function(data) {
        var area = app.getCurArea();
        var player = area.getEntity(data.player);
        var item = area.getEntity(data.item);
        //Only add item for current player
        if(player.entityId === area.getCurPlayer().entityId){
          player.bag.addItem({id: item.kindId, type: item.type});
        }
        area.removeEntity(data.item);
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

    /**
     * the action invokes when the result is killed
     * @param {Object} data 
     */
    var killedAction = function(data) {
      data.target.died = true;
      if (data.target.type === EntityType.MOB) {
        data.target = null;
      }
      new skillEffect(data.skillEffectParams).createEffectAni();
      var attackerSprite = data.attackerSprite;
      var attackerPos = data.attackerPos;
      attackerSprite.translateTo(attackerPos.x, attackerPos.y);
      data.attackerSprite.attack({x1: data.attackerPos.x, y1: data.attackerPos.y, x2: data.targetPos.x, y2: data.targetPos.y}, 'killed');
      data.targetSprite.createNumberNodes(data.resultData.damage);
      data.targetSprite.zeroBlood();
      if (data.attacker.type === EntityType.PLAYER) {
        data.attacker.update({mpUse: data.resultData.mpUse, experience: data.experience});
      }
      data.targetSprite.died({x1: data.targetPos.x, y1: data.targetPos.y, x2: data.attackerPos.x, y2: data.attackerPos.y});
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

