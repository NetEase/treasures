module.exports = function(app) {
  return new Handler(app);
};

var Handler = function(app) {
  this.app = app;
};

var pro = Handler.prototype;

// generate playerId
var id = 1;
/**
 * New client entry game server. Check token and bind user info into session.
 * 
 * @param  {Object}   msg     request message
 * @param  {Object}   session current session object
 * @param  {Function} next    next stemp callback
 * @return {Void}
 */
pro.entry = function(msg, session, next) {
  var self = this;
  var username = msg.username;
  var playerId = id++;
  session.bind(playerId);
  session.set('playerId', playerId);
  session.set('playername', msg.name);
  session.set('areaId', 1);
  session.on('closing', onUserLeave.bind(null, self.app));
  /*
  var opts = {name:'pomelo', create:true};
  self.app.rpc.chat.chatRemote.add(session, player.userId, self.app.get('serverId'), player.name, opts, function() {
    next(null, {code: Code.OK, player: players ? players[0] : null});
  });
  */
};

var onUserLeave = function (app, session, reason) {
  if(!session || !session.uid) {
    return;
  }

  app.rpc.area.playerRemote.playerLeave(session, {playerId:session.playerId, areaId: session.areaId}, null);
  //app.rpc.chat.chatRemote.kick(session, session.uid, app.get('serverId'), {areaId:session.areaId}, null);
  session.closed();
};
