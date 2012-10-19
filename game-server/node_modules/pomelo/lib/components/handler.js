/**
 * Component for handler.
 * Load handlers for current server.
 */
var Loader = require('pomelo-loader');
var pathUtil = require('../util/pathUtil');

/**
 * Component factory function
 * 
 * @param  {Object} app  current application context
 * @return {Object}      component instances
 */
module.exports = function(app) {
  var handlers = loadHandlers(app);
  app.set('handlers', handlers);
};

/**
 * Load handlers from current application
 *
 * @param {Object} app current application context
 * @return {Object} loader of current application
 */
var loadHandlers = function(app) {
  var p = pathUtil.getHandlerPath(app.get('dirname'), app.serverType);
  if(p) {
    return Loader.load(p, app);
  }
};
