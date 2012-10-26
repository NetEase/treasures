__resources__["/dataApi.js"] = {
  meta: {
    mimetype: "application/javascript"
  },

  data: function(exports, require, module, __filename, __dirname) {
    
    function Data(key) {
      this.key = key;
    }

    Data.prototype.set = function(data) {
      localStorage.setItem(this.key, JSON.stringify(data));
    };

    Data.prototype.findById = function(id) {
      var data = this.all();
      return data[id];
    };

    Data.prototype.all = function() {
      return JSON.parse(localStorage.getItem(this.key)) || {};
    };

    // animation data
    function AnimationData() {
    }

    AnimationData.prototype.set = function(data) {
      data || (data = {});
      for (var k in data) {
        localStorage.setItem('ani_' + k, JSON.stringify(data[k]));
      }
    };

    AnimationData.prototype.get = function(id) {
      return JSON.parse(localStorage.getItem('ani_' + id)) || {};
    };

    function Effect(data) {
      this.key = 'effect';
    }

    Effect.prototype.set = function(data) {
      localStorage.setItem(this.key, JSON.stringify(data));
    };

    Effect.prototype.all = function(id) {
      return JSON.parse(localStorage.getItem(this.key)) || {};
    };

    Effect.prototype.findById = function(id) {
      var data = this.all();
      var i, result;
      for (i in data) {
        if (data[i].id  == id) {
          result = data[i];
          break;
        }
      }
      return result;
    };

    exports.getVersion = function() {
      return JSON.parse(localStorage.getItem('version')) || {};
    };

    exports.setVersion = function(version) {
      localStorage.setItem('version', JSON.stringify(version));
    };

    exports.fightskill = new Data('fightskill');
    exports.equipment = new Data( 'equipment');
    exports.item = new Data('item');
    exports.animation = new AnimationData();
    exports.effect = new Effect();

    exports.setData = function(data) {
      if (data) {
        var obj;
        for (var i in data) {
          obj = exports[i];
          if (obj && obj.set) {
            obj.set(data[i]);
          }
        }
      }
    };

  }
};

