__resources__["/main.js"] = {
  meta: {
    mimetype: "application/javascript"
  },
  data: function(exports, require, module, __filename, __dirname) {
    //var config = require('config');
    var pomelo = window.pomelo;
    var config = require('config');
    var app = require('app');
    var dataApi = require('dataApi');
    var msgHandler = require('msgHandler');

    function main() {
      uiInit();
    }

    function entry(name, callback) {
      pomelo.init({host: config.GATE_HOST, port: config.GATE_PORT, log: true}, function() {
        pomelo.request('gate.gateHandler.queryEntry', {uid: name}, function(data) {
          pomelo.disconnect();

          if (data.code === 2001) {
            alert('server error!');
            return;
          }
          if (data.host === '127.0.0.1') {
            data.host = location.hostname;
          }
          // console.log(data);
          pomelo.init({host: data.host, port: data.port, log: true}, function() {
            if (callback) {
              callback();
            }
          });
        });
      });
    }

    var uiInit = function() {
      var btn = document.querySelector('#login .btn');
      btn.onclick = function() {
        var name = document.querySelector('#login input').value;
        entry(name, function() {
          loadAnimation(function() {
            pomelo.request('connector.entryHandler.entry', {name: name}, function(data) {
              pomelo.request("area.playerHandler.enterScene", {name: name, playerId: data.playerId}, function(data){
                msgHandler.init();
                app.init(data.data);
              });
            });
          });
        });
      };
    };

    var jsonLoad = false;
    var loadAnimation = function(callback) {
      if (jsonLoad) {
        if (callback) { 
          callback();
        }
        return;
      }
      pomelo.request('area.playerHandler.getAnimation', function(result) {
        dataApi.animation.set(result.data);
        jsonLoad = true;
        if (callback) {
          callback();
        }
      });
    };

    //主动调用main函数
    exports.main = main;
  }
};
