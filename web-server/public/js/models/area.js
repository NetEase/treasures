__resources__["/area.js"] = {
  meta: {mimetype: "application/javascript"}, 
  data: function(exports, require, module, __filename, __dirname) {
    var Player = require('player');
    var Treasure = require('treasure');
    var Map = require('map');
    var ComponentAdder = require('componentAdder');

    var logic = require("logic");
    var Level = require('level').Level;
    var pomelo = window.pomelo;
    var gameDirector;
    var isStopped = false;
    var app = require('app');

    var requestAnimFrame = (function() {
      return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function(/* function FrameRequestCallback */ callback, /* DOMElement Element */ element) {
        window.setTimeout(callback, 1000/30);
      };
    })();

    function Area(opts) {
      this.id = opts.id || 1;
      this.playerId = opts.playerId;
      this.entities = {};
      this.players = {};
      this.map = null;
      this.componentAdder = new ComponentAdder({area: this});

      //this.scene;
      this.skch = opts.skch;
      this.gd = opts.gd;
      this.gv = opts.gv;

      this.isStopped = false;
      this.init(opts);
    }


    /**
     * Init area, it will init colorbox, entities
     * @param opts {Object} The data for init area, contains entities in the player view, data for map and data for current player.
     */
    Area.prototype.init = function(opts){
      this.initColorBox();

      // width , height should be invoked by map data
      this.map = new Map({scene: this.scene, pos: {x: 0, y: 0}, width: opts.width, height: opts.height});
      for (var key in opts.entities) {
        this.addEntity(opts.entities[key]);
      }
      this.playerId = pomelo.playerId;

      var pos = this.getCurPlayer().getSprite().getPosition();
      this.map.centerTo(pos.x, pos.y);

      var width = parseInt(getComputedStyle(document.getElementById("game")).width);
      var height = parseInt(getComputedStyle(document.getElementById("game")).height);
      
      this.componentAdder.addComponent();
    };

    Area.prototype.run = function(){
      var time = Date.now();

      var tickCount = 0;
      var allCount = 0;
      var frameRate = 0;
      var startTime = time;
      var time2 = time;
      var avgFrame = 0;

      var closure = this;

      var id = 10000000;
      var sum = 100;
      var num = 0;
      var add = true;
      var arr = [];
      //var $frameRate = $('#frame-rate');

      var tick = function() {
        var next = Date.now();
        closure.gd.step(next,  next - time);

        tickCount ++;
        allCount ++;

        var passedTime = next - time2;
        if (passedTime >= 2000) {
          frameRate = Math.round(tickCount * 1000 / passedTime);
          avgFrame = allCount * 1000 / (next - startTime);
          tickCount = 0;
          time2 = next;
          //$frameRate.html('<p>fps: ' + frameRate + '</p><p>afps: ' + parseInt(avgFrame) + '</p>');
          //console.log('[frameRate stat] avgFrame: ' + avgFrame  +' frameRate: ' + frameRate + ' passedTime: ' + passedTime + ' curFrameTime: ' + (next-time));
        }
        if (!isStopped) {
          time = next;
          requestAnimFrame(tick);
        }
      }
      tick();
    };

    /**
     * Get entity from area
     * @param id {Number} The entity id 
     * @api public
     */
    Area.prototype.getEntity = function(id){
      return this.entities[id];
    };

    /**
     * Add entity to area
     * @param entity {Object} The entity add to the area.
     * @api public
     */
    Area.prototype.addEntity = function(entity){
      if(!entity || !entity.entityId) {
        return false;
      }
      entity.scene = this.scene;
      entity.map = this.map;

      var e;
      switch (entity.type) {
        case 'player': 
          e = new Player(entity);
          this.players[e.id] = e.entityId;
        break;
        case 'treasure':
          e = new Treasure(entity);
        break;
        default:
          return false;
      }

      this.entities[entity.entityId] = e;
      this.componentAdder.addComponentTo(e);
      return true;
    };

    /**
     * Remove entity from area
     * @param id {Number} The entity id or the entity to remove.
     * @api public
     */
    Area.prototype.removeEntity = function(id){
      if(!this.entities[id]) {
        return true;
      }

      var e = this.entities[id];
      e.destory();

      delete this.entities[id];
    };

    /**
     * Return the current player
     * @api public
     */
    Area.prototype.getCurPlayer = function() {
      return this.getPlayer(this.playerId);
    };

    /**
     * Get player for given player id
     * @param playerId {String} Player id
     * @return {Object} Return the player or null if the player doesn't exist. 
     * @api public
     */
    Area.prototype.getPlayer = function(playerId) {
      return this.entities[this.players[playerId]];
    };

    /**
     * Remove player from area
     * @param playerId {String} Player id
     * @api public
     */
    Area.prototype.removePlayer = function(playerId) {
      return this.removeEntity(this.players[playerId]);
    };

    /**
     * Init colorbox environment
     * @api public
     */
    Area.prototype.initColorBox = function() {
      var skch = this.skch;
      var logicObj = new logic.Logic();
      this.scene = logicObj.getScene();

      this.gLevel = new Level({
        logic: logicObj
      });
      this.gd.setLevel(this.gLevel);
      var closure = this;

      window.onresize = function() {
        var game = document.getElementById("game");
        var width = parseInt(getComputedStyle(game).width);
        var height = parseInt(getComputedStyle(game).height);

        closure.skch.width = width;
        closure.skch.height = height;

        // pomelo.notify({route: 'area.playerHandler.changeView', width: width, height: height});
      };
    };

    module.exports = Area;
  }
};

