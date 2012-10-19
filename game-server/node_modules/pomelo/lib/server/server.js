/**
 * Implementation of server component.
 * Init and start server instance.
 */
var sio = require('socket.io');
var logger = require('../util/log/log').getLogger(__filename);
var pomelo = require('../pomelo');
var sessionService = require('../common/service/sessionService');
var taskManager = require('../common/service/taskManager');
var handlerManager = require('../handlerManager');
var protocol=require('pomelo-protocol');
var gateway, proxy;

var WS_STATE_NOT_STARTED  = 0;   // websocket server has not started yet
var WS_STATE_STARTED      = 1;   // websocket server has started
var WS_STATE_STOPED       = 2;   // websocket server has stoped

/**
 * Server factory function.
 *
 * @param  {Object} app  current application context
 * @param  {Object} opts construct paramters
 *                       opts.server {Object} current server info. {id, host, port, wsPort, ...}
 *                       opts.flushInterval {Number} message queue flush interval
 *                       opts.sendDirectly {Boolean} message should be sent directly or cache and wait for flush
 * @return {Object}      server instance
 */
module.exports.create = function(app, opts) {
  return new Server(app, opts);
};

var Server = function (app, opts) {
  this.app = app;
  this.server = opts.server;
  this.flushInterval = opts.flushInterval || 100;  //client message flush interval. default 100ms
  this.sendDirectly = opts.sendDirectly || false;
  this.wsstate= WS_STATE_NOT_STARTED;
  sessionService.sendDirectly = this.sendDirectly;
};

var pro = Server.prototype;

pro.name = 'server';

/**
 * Server lifecycle callback
 */
pro.afterStart = function(cb) {
  //this.app.enable('schedulerService');
  if(this.app.isFrontend()) {
    startWebsocket(this.server.wsPort, this, this.app);
  }
  process.nextTick(cb);
};

/**
 * 关闭服务器
 */
pro.stop = function() {
  if(this.app.isFrontend()) {
    stopWebsocket(this);
  }
};

/**
 * handle request
 */
pro.handle = function(msg, session, cb) {
  var filterManager = this.app.get('filterManager');
  var self = this;

  function handle(err, resp) {
    if(err) {
      // error from before filter
      self.handleError(err, msg, session, resp, function(err) {
        doAfterFilter(err, msg, session, cb);
      });
      return;
    }

    handlerManager.handle(msg, session, function(err, resp) {
      if(err) {
        //error from handler
        self.handleError(err, msg, session, resp, function(err, resp) {
          doAfterFilter(err, msg, session, resp, cb);
        });
        return;
      }

      //everything is ok, do the after filter
      doAfterFilter(err, msg, session, resp, cb);
    });
  }  //end of handle

  if(filterManager) {
    //do the before filter
    filterManager.beforeFilter(msg, session, handle);
  } else {
    handle();
  }
};

/**
 * pass err to the global error handler if specified
 */
pro.handleError = function(err, msg, session, resp, cb) {
  var handler = this.app.get('errorHandler');
  if(!handler) {
    logger.warn('no default error handler to resolve unknown exception. ' + err.stack);
    cb(err);
  } else {
    handler(err, msg, session, cb);
  }
};

/**
 * Start to listen the websocket port and receive websocket messages.
 * @param  {Number} port   websocket port
 * @param  {Object} server server instance
 * @return {Void}
 */
var startWebsocket = function (port, server) {
  var wsocket = sio.listen(port);
  wsocket.set('log level', 1);
  var connectionService = server.app.components.connection;
  wsocket.sockets.on('connection', function (socket) {
    connectionService.increaseConnectionCount();

    socket.on('disconnect', function() {
      var uid = session ? session.uid : null;
      connectionService.decreaseConnectionCount(uid);
    });

    //create session for connection
    var session = getSession(socket, server);

    /**
     * new client message
     */
    socket.on('message', function(msg) {
      if(!msg) {
        //ignore empty request
        return;
      }

      var dmsg = protocol.decode(msg);
      var type = checkServerType(dmsg.route);
      if(!type) {
        logger.error('meet invalid route string. ' + dmsg.route);
        return;
      }

      var curSession = session.cloneSession();
      server.handle(dmsg, curSession, function(err, resp) {
        if(resp) {
          if(!dmsg.id) {
            logger.error('try to response to a notify: %j', resp);
            return;
          }
          resp = {
            id: dmsg.id,
            body: resp
          };
          sessionService.sendMessage(session.key, resp);
        }
      });
    }); //on message end
  }); //on connection end

  if(!server.sendDirectly) {
    setInterval(function() {
      sessionService.flush();
    }, server.flushInterval);
  }

  server.wsocket = wsocket;
  server.wsstate = WS_STATE_STARTED;
};

var stopWebsocket = function(server) {
  server.wsstate = WS_STATE_STOPED;
  if(server.wsocket) {
    server.wsocket.server.close();
  }
};

/**
 * get session for current connection
 */
var getSession = function(socket, server) {
  var app = server.app;
  var connectionService = app.components.connection;
  var session = sessionService.getSession(socket.id);
  if(!!session) {
    return session;
  }

  session = sessionService.createSession({
    key: socket.id,
    socket: socket,
    frontendId: app.get('serverId')
  });

  // bind events for session
  socket.on('disconnect', session.closing.bind(session));
  socket.on('error', session.closing.bind(session));
  session.on('closing', function(session) {
    if(!!session && !session.uid) {
      //close it directly if not logined
      session.closed();
    }
  });
  session.on('closed', function(session) {
    sessionService.removeSession(session.key);
    taskManager.closeQueue(session.key, true);
  });
  session.on('bind', function(session) {
    connectionService.addLoginedUser(session.uid, {
      loginTime: Date.now(),
      uid: session.uid,
      address:socket.handshake.address.address + ':' + socket.handshake.address.port,
      username: session.username
    });
  });

  return session;
};

/**
 * do the after filter
 */
var doAfterFilter = function(err, msg, session, resp, cb) {
  var filterManager = pomelo.app.get('filterManager');
  if(!!filterManager) {
    filterManager.afterFilter(err, msg, session, resp, cb);
  } else {
    cb(err, resp);
  }
};

/**
 * Get server type form request message.
 */
var checkServerType = function (route) {
  if(!route) {
    return null;
  }
  var idx = route.indexOf('.');
  if(idx < 0) {
    return null;
  }
  return route.substring(0, idx);
};
