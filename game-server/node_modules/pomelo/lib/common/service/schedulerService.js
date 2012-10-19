var schedule = require('pomelo-schedule');
var pomelo = require('../../pomelo');
var logger = require('../../util/log/log').getLogger(__filename);

module.exports.run = run;

/**
 * schedule task entry
 */
function run (config) {
  var app = pomelo.app;

  var serverId = app.get('serverId');
  var triggers = config[serverId];

  for(var key in triggers){
    var trigger = triggers[key];
    schedule.scheduleJob(trigger[0], mailJob, {str:trigger[1], params:trigger[2], serverId: serverId});
  }
}

/**
 * Invoke the schedule task
 */
function mailJob(data){
  var str = data.str;
  var serverId = data.serverId;

  if(!serverId) {
    logger.error('Fail to run schedule job, unknown server id');
    return;
  }

  var app = pomelo.app;

  var ts = str.split('.');
  if(ts.length !== 2) {
    logger.error('Fail to run schedule job, invalid invoke string: %j', str);
    return;
  }
  var service = ts[0];
  var method = ts[1];

//  var service = 'area';
  var msg = {
    namespace: 'user', 
    service: service,
    method: method,
    args: [data.params]
  };

  app.components.proxy.client.rpcInvoke(serverId, msg, function(err){
    if(err) {
      logger.error("Run schedule Job error ! " + err.stack);
    }
  });
}


