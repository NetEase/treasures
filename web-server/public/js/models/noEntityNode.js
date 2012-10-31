__resources__["/noEntityNode.js"] = {meta: {mimetype: "application/javascript"}, data: function(exports, require, module, __filename, __dirname) {
  /**
   * Module dependencies.
   */
  var pomelo = window.pomelo;
  var app = require('app');
  var imgAndJsonUrl = require('config').IMAGE_URL;
  var Node = require('node').Node;
  var helper = require('helper');
  var animate = require('animate');
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
    fill = 'rgb(255,0,0)';
    switch(data.type) {
      case EntityType.PLAYER: 
        name = data.name + ' - ' + data.level;
        break;
      case EntityType.MOB:
        name = data.kindName + ' - ' + data.level + '-' + data.entityId;
        font = '';
        break;
      case EntityType.NPC:
        name = data.kindName;
        break;
      default:
        name = data.name;
        font = '';
    }
    var nameModel = new model.TextModel({
      text: name,
      fill: fill, 
      font: font, 
      height: 14
    });
    nameModel.set('ratioAnchorPoint', {
      x: 0.5,
      y:0.5
    });
    var nameNode = data.scene.createNode({
      model: nameModel
    });
    return nameNode;
  }

  /**
   * Create bloodbarNodes, which contain redBar and darkBar
   *
   * @param {Object} data
   * @return {Object}
   * @api public
   */
  NoEntityNode.createBloodbarNodes = function(data) {
    var ResMgr = app.getResMgr();
    var redImg = ResMgr.loadImage(imgAndJsonUrl+'number/bloodbar.png');
    var darkImg = ResMgr.loadImage(imgAndJsonUrl+'number/bloodbar_bk.png');
    var redModel = new model.RectModel({
      x: 0,
      y: 0,
      width: 45,
      height: 6,
      fill: 'rgb(255,0,0)',
      stroke:'rgb(255,0,0)'
     });
     var darkModel = new model.RectModel({
      x: 0,
      y: 0,
      width: 45,
      height: 6,
      fill: 'rgb(0,0,0)',
      stroke:'rgb(0,0,0)'
     });
     var redBloodBarNode = data.scene.createNode({
       model: redModel
     });
     var darkBloodBarNode = data.scene.createNode({
       model: darkModel
     });
     return {redBloodBarNode: redBloodBarNode, darkBloodBarNode: darkBloodBarNode};
  };

}};
