/**
 * Request message util
 */

var exp = module.exports;

/**
 * Pare request route string.
 * Route string format: serverType.handlerName.methodName
 * 
 * @param  {String} route route string
 * @return {Object}       route record {serverType, handler, method}
 */
exp.parseRoute = function(route) {
	if(!route) {
		return null;
	}
	var ts = route.split('.');
	if(ts.length != 3) {
		return null;
	}

	return {
		serverType: ts[0], 
		handler: ts[1], 
		method: ts[2]
	};
};