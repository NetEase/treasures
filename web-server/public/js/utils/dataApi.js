__resources__["/dataApi.js"] = {
  meta: {
    mimetype: "application/javascript"
  },

  data: function(exports, require, module, __filename, __dirname) {
    
    // animation data
    function AnimationData() {
      this.data = {};
    }

    AnimationData.prototype.set = function(data) {
      this.data = data;
    };

    AnimationData.prototype.get = function(id) {
      return this.data[id]
    };
   
    exports.animation = new AnimationData();

  }
};

