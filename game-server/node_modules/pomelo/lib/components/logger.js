/**
 * Component for logger.
 * Load logger config and init logger.
 */
var log = require('../util/log/log');
var exp = module.exports;

/**
 * Component factory function
 * 
 * @param  {Object} app  current application context
 * @param  {Object} opts construct parameters
 * @return {Object}      component instance
 */
module.exports = function(app) {
  log.configure(app);
  // no need to add component into the app components
};
