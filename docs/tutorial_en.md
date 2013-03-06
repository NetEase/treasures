#Tutorial 2 -- Treasures
##Description

[Treasures](https://github.com/NetEase/treasures) game which extracted from the game [LordOfPomelo](https://github.com/NetEase/lordofpomelo) and remove a lot of game logic, in order to show the working principle and usage of the [Pomelo](https://github.com/NetEase/pomelo) framework more clearly.

Treasures is very simple, just enter a name, a game character will be randomly generated, and then enter the game scene. Some treasures scattered ground in the game scene , each treasure have score, the player operate the game characters to pick up the treasures, and then will be able to get the scores.

##Install and Run

Install `pomelo` with `npm`
```bash
npm install -g pomelo
```
Get the source code
```bash
git clone git@github.com:NetEase/treasures.git
```
Install the dependencies (enter the project directory first)
```bash
sh npm-install.sh
```
Start the `web-server`  (enter the `web-server` directory first)
```bash
node app.js
```
Start the `game-server` (enter the `game-server` directory first)
```bash
pomelo start
```
visit [http://localhost:3001](http://localhost:3001) in your modern brower(the latest chrome is best), and enter the game.

You can get more details with Pomelo's [quick start guide](https://github.com/NetEase/pomelo/wiki/Quick-start-guide)

And another [tutorial](https://github.com/NetEase/pomelo/wiki/Distributed%20Chat) for study.

##Architecture
Treasures  has 2 parts which are `web-Server` and `game-Server`.

* `web-server` is a simple http server, based on Express

* `game-server` is a webSocket server for running the game logic

Let's have a look at the architecture of the `game-server` from the config file `game-server/config/server.json`
```javascript
{
  "development": {
    "connector": [
      {"id": "connector-server-1", "host": "127.0.0.1", "port": 3150, "wsPort": 3010},
      {"id": "connector-server-2", "host": "127.0.0.1", "port": 3151, "wsPort": 3011}
    ],
    "area": [
      {"id": "area-server-1", "host": "127.0.0.1", "port": 3250, "areaId": 1}
    ],
    "gate": [
      {"id": "gate-server-1", "host": "127.0.0.1", "wsPort": 3014}
    ]
  }
}
```

It can be seen that the server side is constituted by the following components:

* 2 `connector` servers, for receiving and sending messages.
* A `gate` server is mainly used for load balancing which dispatch the connections to the `connector` servers.
* An `area` server used to drive the game scene, and the game logic.

The relationship between the servers, as the following diagram:

![treasure-arch](http://pomelo.netease.com/resource/documentImage/treasure-arch.png)

##Source code analysis
Analyzed the code by the flow of the game.

###1. Connect to the server
clinet: `web-server/public/js/main.js`

```javascript
pomelo.request('gate.gateHandler.queryEntry', {uid: name}, function(data) {
  //...
});
```
server: `game-server/app/servers/gate/handler/gateHandler.js`
```javascript
Handler.prototype.queryEntry = function(msg, session, next) {
  // ...
  // return the host and port of the connector server
  next(null, {code: Code.OK, host: res.host, port: res.wsPort});
};
```
So that the client will be able to connect to the `connector` server

###2. Enter the Game
After establishing a connection with the `connector` server, began to enter the game.

```javascript
pomelo.request('connector.entryHandler.entry', {name: name}, function(data) {
  // ...
});
```
When the client sends a request to the `connector` server for the first time, the server will initialize a `session` bind with some events.

```javascript
// session bind with playerId
session.bind(playerId);
// set player's areaId
session.set('areaId', 1);
```

The client send a request to the server for entering game scene
```javascript
pomelo.request("area.playerHandler.enterScene", {name: name, playerId: data.playerId}, function(data) {
  // ...
});
```

After the client sends a request to the server, the request will reach the `connector` server at first, and the `connector` server route the request to the appropriate server `area` (There is only one `area` server in this example) according to the route rules(`game-server/app/util/routeUtil.js`). And then `playerHandler` in `area` server treating the corresponding request. Players added to the game scene.


After a player is added to the game scene, the other players must be able to see the player to join in real time, so the server must broadcast the message to all players in this game scene.

Create a channel, all players in this game scene will be added to the channel.
```javascript
// get the channel. If there is no channel exsit, create one.
channel = pomelo.app.get('channelService').getChannel('area_' + id, true);
// add the player to channel
channel.add(e.id, e.serverId);
```

When someone joins or state changes, these messages will be pushed to each player in this area. 
For example, a player join the area
```javascript
channel.pushMessage({route: 'addEntities', entities: added});
```

These messages are sent to the client through the `connector` server. And the `area` determine which `connector` server sent out by `session.frontendId`.

The client accept messages:
```javascript
// When new players to join, the server will broadcast a message to all players. The client bind through this route, to get the message 
pomelo.on('addEntities', function(data) {
  // ...
});
```

###3. Area Server
Are server is a tick-driven game scenes. Each tick will update the status of the entity in the scene, and if the state has changed, these changes will be pushed to the client.

```javascript
function tick() {
  //run all the action
  area.actionManager().update();
  // update entities
  area.entityUpdate();
  // update rank
  area.rankUpdate();
}
```
A player do a `move` action
client:
```javascript
// send a `move` request to server
pomelo.notify('area.playerHandler.move', {targetPos: {x: entity.x, y: entity.y}, target: targetId});
```
server:
```javascript
// in playerHandler
handler.move = function(msg, session, next) {
  // ...
  // create a move action
  var action = new Move({
    entity: player,
    endPos: endPos,
  });
});
```
And this `action` will update in next `tick`.

###4. Client to send and receive messages
The client and server communications in several ways:

* Request - Response

```javascript
// send a request to connector server，params {name: name}
pomelo.request('connector.entryHandler.entry', {name: name}, function(data) {
  // callback
  // do something
});
```

* Notify

```javascript
// send a notification to server
pomelo.notify('area.playerHandler.move', {targetPos: {x: entity.x, y: entity.y}, target: targetId});
```

* Push

```javascript
// When new players to join, the server will broadcast a message to all players.The client bind through this route, to get the message
pomelo.on('addEntities', function(data) {
  // ...
});
```

###5. Leave the game
When the player leaves the game, the disconnect message is received by connector server, then it needs to removed the user is in area server, and broadcast a message to other online players.

Every server processes are independent, so it need RPC. Fortunately, do an RPC is so easy in Pomelo framework.

The `area` server want to provide a series of remote interface for other server process calls only need to create a `remote` directory in `servers/area` directory. Interface exposed by the files in this directory can be used as an RPC call interface.

For example, a player leave the game:

```javascript
// when the session closed, it will emit a event
session.on('closed', onUserLeave.bind(null, self.app));

var onUserLeave = function (app, session, reason) {
  if (session && session.uid) {
    // do an rpc
    app.rpc.area.playerRemote.playerLeave(session, {playerId: session.get('playerId'), areaId: session.get('areaId')}, null);
  }
};
```
In server: 
```javascript
// area/remote/playerRemote.js
exports.playerLeave = function(args, cb) {
  // push message
  area.getChannel().pushMessage({route: 'onUserLeave', code: consts.MESSAGE.RES, playerId: playerId});
  // ...
};
```
This easily completed an RPC!