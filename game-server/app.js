var pomelo = require('pomelo');
var area = require('./app/models/area');
var dataApi = require('./app/util/dataApi');

/**
 * Init app for client.
 */
var app = pomelo.createApp();
app.set('name', 'treasures');

app.configure('production|development', 'gate', function(){
  app.set('connectorConfig', {
      connector : pomelo.connectors.hybridconnector,
  });
});

app.configure('production|development', 'connector', function(){
  app.set('connectorConfig', {
      connector : pomelo.connectors.hybridconnector,
      heartbeat : 3,
      useDict : true,
      useProtobuf : true
  });
});

app.configure('production|development', 'area', function(){
  var areaId = app.get('curServer').areaId;
  if (!areaId || areaId < 0) {
    throw new Error('load area config failed');
  }
  area.init(dataApi.area.findById(areaId));
});

// start app
app.start();

process.on('uncaughtException', function (err) {
  console.error(' Caught exception: ' + err.stack);
});
