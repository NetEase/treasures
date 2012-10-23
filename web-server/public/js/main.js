__resources__["main.js"] = {
  meta: {
    mimetype: "application/javascript"
  },
  data: function(exports, require, module, __filename, __dirname) {
    var clientManager = require('clientManager');
    var heroSelectView = require('heroSelectView');
    var config = require('config');
    var pomelo = window.pomelo;

    function main() {
      //pomelo.addScript(config.BASE_URL);

      clientManager.init();

      heroSelectView.init();
    }

    //主动调用main函数
    exports.main = main;
  }
};
