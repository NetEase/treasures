__resources__["/app.js"] = {
  meta: {mimetype: "application/javascript"},
  
  data: function(exports, require, module, __filename, __dirname) {
    var gameMsgHandler = require('msgHandler'); // server message handler
    var Area = require('area');
    var ComponentAdder = require('componentAdder');
    var ResMgr = require('resmgr').ResMgr;
    //var ObjectPoolManager = require('objectPoolManager');
    var view = require("view");
    var director = require('director');
    var helper = require("helper");
    var pomelo = window.pomelo;

    var inited = false;
    var skch = null;
    var gd = null;
    var gv = null;
    var area = null;
    var resMgr = null;
    // var poolManager = null;
    var delayTime = null;

    /**
     * Init client area
     * @param data {Object} The data for init area
     */
    function init(data) {
      // var mapData = data.mapData;
      changeView('game');
      pomelo.playerId = data.playerId;
      if (inited) {
        configData(data.area);
        area = new Area(data.area);
      } else {
        initColorBox();
        configData(data.area);
        area = new Area(data.area);

        start();

        inited = true;
      }
    }

    function changeView(id) {
      var cur = document.querySelector('.panel.current');
      cur.className = cur.className.replace('current', '').trim();
      var p = document.getElementById(id);
      p.className = p.className + ' current';
      var rank = document.getElementById('rank');
      rank.className = id == 'game' ? '' : 'hide';
    }

    /**
     * Start area
     * @api private
     */
    function start() {
      area.run();
    }

    /**
     * Init color box, it will init the skch, gv, gd
     * @api private
     */
    function initColorBox() {
      if (!skch) {
        var main = document.getElementById("game");
        var width = parseInt(getComputedStyle(main).width, 10);
        var height = parseInt(getComputedStyle(main).height, 10);
        skch = helper.createSketchpad(width, height, document.getElementById("game"));
        skch.cmpSprites = cmpSprites;
      }

      gv = new view.HonestView(skch);
      gv.showUnloadedImage(false);
      gd = director.director({
        view: gv
      });
    }

    function getArea() {
      return area;
    }

    /**
     * Get current player
     */
    function getCurPlayer() {
      return getArea().getCurPlayer();
    }

    function getResMgr(){
      if(!resMgr){
        resMgr = new ResMgr();
      }

      return resMgr;
    }

    /**
     * Reconfig the init data for area
     * @param data {Object} The init data for area
     * @api private
     */
    function configData(data){
      data.skch = skch;
      data.gd = gd;
      data.gv = gv;
    }

    var cmpSprites = function(s1, s2) {
      var m1 = s1.exec('matrix');
      var m2 = s2.exec('matrix');
      var dz = m1.tz - m2.tz;
      if (dz === 0) {
        var dy = m1.ty - m2.ty;
        if (dy === 0) {
          return m1.tx - m2.tx;
        }
        return dy;
      }
      return dz;
    };

    exports.init = init;
    exports.getResMgr = getResMgr;
    exports.getCurArea = getArea;
    exports.getCurPlayer = getCurPlayer;
    exports.changeView = changeView;
  }
};

