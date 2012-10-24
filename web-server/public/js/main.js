__resources__["/main.js"] = {
  meta: {
    mimetype: "application/javascript"
  },
  data: function(exports, require, module, __filename, __dirname) {
    //var config = require('config');
    var pomelo = window.pomelo;
    var config = require('config');
    var app = require('app');

    function main() {
      pomelo.init({host: config.GATE_HOST, port: config.GATE_PORT, log: true}, function() {
        uiInit();
      });


    }

    var uiInit = function() {
      var btn = document.querySelector('#login .btn');
      btn.onclick = function() {
        var name = document.querySelector('#login input').value;
        pomelo.request({route: "area.playerHandler.enterScene", name: name}, function(data){
          app.init(data.data);
        });
      };
    }

    //主动调用main函数
    exports.main = main;
  }
};
