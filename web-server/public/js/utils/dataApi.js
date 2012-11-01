__resources__["/dataApi.js"] = {
  meta: {
    mimetype: "application/javascript"
  },

  data: function(exports, require, module, __filename, __dirname) {
    
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


   
    exports.animation = new AnimationData();

  }
};

