var pomelo = require('pomelo');
var RPC_FLUSH_INTERVAL = 30;
var app = pomelo.createApp();

app.set('name', 'treasures');
app.set('dirname', __dirname);

app.defaultConfiguration();

app.configure('production|development', function () {
  if (app.serverType !== 'master') {
    app.load(pomelo.remote, {cacheMsg:true, interval:RPC_FLUSH_INTERVAL});
  }
});

app.loadDefaultComponents();

app.start();

function startWebServer() {
  var app_express = require('./app_express');
  console.log('[AppWebServerStart] listen, visit http://0.0.0.0:3001/index.html');
}

if (app.serverType === 'master') {
  startWebServer();
  app.startConsole();
}

process.on('uncaughtException', function (err) {
  console.error(' Caught exception: ' + err.stack);
});
