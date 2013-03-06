__resources__["/msgHandler.js"] = {
  meta: {mimetype: "application/javascript"},
  data: function(exports, require, module, __filename, __dirname) {

    var pomelo = window.pomelo;
    var app = require('app');
    var EntityType = require('consts').EntityType;
    
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
        sprite.movePath([sPos, data.endPos]);
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
        player.set('score', player.score + data.score);
        player.getSprite().scoreFly(data.score);
        player.getSprite().updateName(player.name + ' - ' + player.score);
        area.removeEntity(item.entityId);
      });

      pomelo.on('rankUpdate', function(data) {
        var ul = document.querySelector('#rank ul');
        var area = app.getCurArea();
        var li = "";
        data.entities.forEach(function(id) {
          var e = area.getEntity(id);
          if (e) {
            li += '<li><span>' + e.name + '</span><span>' + e.score + '</span></li>';  
          }
        });
        ul.innerHTML = li;
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

    };
  }
};

