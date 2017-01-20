var bearcat = require('bearcat');
var pomelo = require('pomelo');

/**
 * Init app for client.
 */
var app = pomelo.createApp();

var Configure = function() {
  app.set('name', 'treasures');

  app.configure('production|development', 'gate', function() {
    app.set('connectorConfig', {
      connector: pomelo.connectors.hybridconnector
    });
  });

  app.configure('production|development', 'connector', function() {
    app.set('connectorConfig', {
      connector: pomelo.connectors.hybridconnector,
      heartbeat: 100,
      useDict: true,
      useProtobuf: true
    });
  });

  app.configure('production|development', 'area', function() {
    var areaId = app.get('curServer').areaId;
    if (!areaId || areaId < 0) {
      throw new Error('load area config failed');
    }

    var areaService = bearcat.getBean('areaService');
    var dataApiUtil = bearcat.getBean('dataApiUtil');
    areaService.init(dataApiUtil.area().findById(areaId));
  });
}

var contextPath = require.resolve('./context.json');
bearcat.createApp([contextPath]);

bearcat.start(function() {
  Configure();
  app.set('bearcat', bearcat);
  // start app
  app.start();
});

process.on('uncaughtException', function(err) {
  console.error(' Caught exception: ' + err.stack);
});