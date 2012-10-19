var pomelo = require('pomelo');
var RPC_FLUSH_INTERVAL = 30;
var app = pomelo.createApp();

app.set('name', '$');
app.set('dirname', __dirname);

app.enable('proxy');

app.defaultConfiguration();

app.start();

function startWebServer() {
    var app_express = require('./app_express');
    console.log('[AppWebServerStart] listen, visit http://0.0.0.0:3001/index.html');
}

if (app.isMaster()) {
    startWebServer();
}

process.on('uncaughtException', function (err) {
    console.error(' Caught exception: ' + err.stack);
});
