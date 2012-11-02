var area = require('./area');
var EntityType = require('../consts/consts').EntityType;
var logger = require('pomelo-logger').getLogger(__filename);

var exp = module.exports;

exp.run = function (){
  setInterval(tick, 100);
};

function tick(){

  //run all the action
  area.actionManager().update();
  area.entityUpdate();

  // area.aiManager().update();

  // area.patrolManager().update();
}

/**
 * Add action for area
 * @param action {Object} The action need to add
 * @return {Boolean}
 */
exp.addAction = function(action){
  return area.actionManager().addAction(action);
};

/**
 * Abort action for area
 * @param type {Number} The type of the action
 * @param id {Id} The id of the action
 */
exp.abortAction = function(type, id){
  return area.actionManager().abortAction(type, id);
};

/**
 * Abort all action for a given id in area
 * @param id {Number} 
 */
exp.abortAllAction = function(id){
  area.actionManager().abortAllAction(id);
};

/**
 * Update object for aoi
 * @param obj {Object} Given object need to update.
 * @param oldPos {Object} Old position.
 * @param newPos {Object} New position.
 * @return {Boolean} If the update success.
 */
exp.updateObject = function(obj, oldPos, newPos) {
  return area.aoi().updateObject(obj, oldPos, newPos);
};
