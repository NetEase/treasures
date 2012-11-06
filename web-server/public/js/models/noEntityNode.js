__resources__["/noEntityNode.js"] = {meta: {mimetype: "application/javascript"}, data: function(exports, require, module, __filename, __dirname) {
  /**
   * Module dependencies.
   */
  var model = require('model');
  var EntityType = require('consts').EntityType;

  var NoEntityNode = module.exports;

  /**
   * Create nameNode with a text model.
   *
   * @param {Object} data
   * @api public
   */
  NoEntityNode.createNameNode = function(data) {
    var name;
    var font = 'Arial Bold';
    var fill = 'rgb(255,10,10)';
    switch(data.type) {
      case EntityType.PLAYER: 
        name = data.name + ' - ' + data.treasureCount;
        break;
      case EntityType.TREASURE:
        name = data.kindName;
        font = 'Arial';
        break;
      default:
        name = data.name;
        font = 'Arial';
    }
    var nameModel = new model.TextModel({
      text: name,
      fill: fill, 
      font: font, 
      height: '14px'
    });
    nameModel.set('ratioAnchorPoint', {
      x: 0.5,
      y:0.5
    });
    var nameNode = data.scene.createNode({
      model: nameModel
    });
    return nameNode;
  };

}};
