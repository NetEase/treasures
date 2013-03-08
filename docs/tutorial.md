#Tutorial 2 -- Treasures
##描述
[Treasures](https://github.com/NetEase/treasures) 游戏是从 [LordOfPomelo](https://github.com/NetEase/lordofpomelo) 中抽取出来，去掉了大量的游戏逻辑，用以更好的展示 [Pomelo](https://github.com/NetEase/pomelo) 框架的用法以及运作机制。

Treasures 很简单，输入一个用户名后，会随机得到一个游戏角色，进入游戏场景。在游戏场景中地上会散落一些宝物，每个宝物都有分数，玩家操作游戏人物去捡起地上的宝物，然后就能得到相应的分数。

##安装和运行
安装 `pomelo`

```bash
npm install -g pomelo
```
获取源码
```bash
git clone git@github.com:NetEase/treasures.git
```
安装 `npm` 依赖包（先进入项目目录）
```bash
sh npm-install.sh
```
启动 `web-server`  (先进入`web-server`目录)
```bash
node app.js
```
启动 `game-server` (先进入`game-server`目录)
```bash
pomelo start
```
在浏览器中访问 [http://localhost:3001](http://localhost:3001) 进入游戏

如有问题，可以参照 [pomelo快速使用指南](https://github.com/NetEase/pomelo/wiki/pomelo%E5%BF%AB%E9%80%9F%E4%BD%BF%E7%94%A8%E6%8C%87%E5%8D%97)

也可以参照 [tutorial 1](https://github.com/NetEase/pomelo/wiki/tutorial1--%E5%88%86%E5%B8%83%E5%BC%8F%E8%81%8A%E5%A4%A9)

##架构
Treasures 分为 web-Server 和 game-Server 两部分。

* `web-server` 是用 Express 建立的最一个基础的 http 服务，用来支撑浏览器页面的访问。

* `game-server` 是 WebSocket 服务器，用来运行整个游戏的逻辑。

首先，通过配置文件，来看 `game-server` 的具体架构 `game-server/config/server.json`
```javascript
{
  "development": {
    "connector": [
      {"id": "connector-server-1", "host": "127.0.0.1", "port": 3150, "clientPort": 3010, "frontend": true},
      {"id": "connector-server-2", "host": "127.0.0.1", "port": 3151, "clientPort": 3011, "frontend": true}
    ],
    "area": [
      {"id": "area-server-1", "host": "127.0.0.1", "port": 3250, "areaId": 1}
    ],
    "gate": [
      {"id": "gate-server-1", "host": "127.0.0.1", "clientPort": 3014, "frontend": true}
    ]
  }
}
```
可以看出，服务端是由以下几个部分构成：

* 2 个 `connector` 服务器，主要用于接受和发送消息。
* 1 个 `gate` 服务器，主要用于负载均衡，将来自客户端的连接分散到两个 `connector` 服务器上。
* 1 个 `area` 服务器，主要用于驱动游戏场景，和游戏逻辑

服务器直接的关系，如下图：

![treasure-arch](http://pomelo.netease.com/resource/documentImage/treasure-arch.png)

##源码分析
通过游戏流程来分析代码。

###1. 连接服务器
客户端 `web-server/public/js/main.js` 中 `entry` 方法中

```javascript
pomelo.request('gate.gateHandler.queryEntry', {uid: name}, function(data) {
  //...
});
```
服务端 `game-server/app/servers/gate/handler/gateHandler.js` 中
```javascript
Handler.prototype.queryEntry = function(msg, session, next) {
  // ...
  // 返回要连接的 connector 服务器的 host 和 port
  next(null, {code: Code.OK, host: res.host, port: res.wsPort});
};
```
这样客户端就能连接到分配的 `connector` 服务器上。

###2. 进入游戏
在与 `connector` 服务器建立连接之后，开始进入游戏

```javascript
pomelo.request('connector.entryHandler.entry', {name: name}, function(data) {
  // ...
});
```
在客户端第一次向 `connector` 服务器发送请求时，服务器会将 `session` 信息进行初始化和绑定

```javascript
// session 与 playerId 绑定
session.bind(playerId);
// 设置玩家 areaId
session.set('areaId', 1);
```

进入游戏场景，客户端向服务端发起进入场景请求：

```javascript
pomelo.request("area.playerHandler.enterScene", {name: name, playerId: data.playerId}, function(data) {
  // ...
});
```

客户端向服务端发送请求后，先到达 `connector` 服务器，然后 `connector` 服务器根据 `game-server/app/util/routeUtil.js` 中转发规则，将请求路由到相应的 `area` 服务器（本例子中只有一个`area`服务器），`area` 服务器中的 `playerHandler` 再处理相应的请求。这样玩家就加入到游戏场景中了。

在一个玩家加入到游戏场景之后，其他玩家必须能即时的看到这个玩家的加入，所以服务端必须将消息广播到在此游戏场景中的所有玩家。
建立 `channel`，所有加入此游戏场景的玩家都会加入到这个 `channel` 中
```javascript
// 获取 channel，如果没有就创建一个
channel = pomelo.app.get('channelService').getChannel('area_' + id, true);
// 将玩家加入 channel
channel.add(e.id, e.serverId);
```
当 `area` 中有玩家加入，或其他状态发生改变时，这些信息都会被推送到在这个 `channel` 中的每个玩家。比如有玩家加入时：

```javascript
channel.pushMessage({route: 'addEntities', entities: added});
```
这些消息都是通过 `connector` 服务器发送到客户端。而 `area` 中的消息是通过 `session.frontendId` 来决定是由哪个 `connector` 服务器发出去。

客户端接受消息：
```javascript
// 当有新玩家加入时，服务端会广播消息给所有玩家。客户端通过这个路由绑定，来获取消息
pomelo.on('addEntities', function(data) {
  // ...
});
```

###3. Area 服务器
`area` 服务器是一个由 `tick` 驱动的游戏场景。每个 `tick` 都会对场景中的 `entity` 的状态进行更新，如果状态有发生改变，这些改变会被推送到客户端。
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
比如玩家发起一个 `move` 动作:

客户端
```javascript
// 向服务端发送 move 请求通知
pomelo.notify('area.playerHandler.move', {targetPos: {x: entity.x, y: entity.y}, target: targetId});
```
服务端 `playerHandler` 接受请求：
```javascript
handler.move = function(msg, session, next) {
  // ...
  // 产生一个 move action
  var action = new Move({
    entity: player,
    endPos: endPos,
  });
});
```
然后这个 `action` 会在每个 `tick` 中更新。

###4. 客户端发送和接受消息
客户端和服务端的通讯有以下几种方式：

* Request - Response 方式

```javascript
// 向 connector 发送请求，参数 {name: name}
pomelo.request('connector.entryHandler.entry', {name: name}, function(data) {
  // 回调函数得到请求返回结果
  // do something
});
```

* Notify (向服务端发送通知)

```javascript
// 向服务端发送 move 请求通知
pomelo.notify('area.playerHandler.move', {targetPos: {x: entity.x, y: entity.y}, target: targetId});
```

* Push （服务端主动发送消息到客户端）

```javascript
// 当有新玩家加入时，服务端会广播消息给所有玩家。客户端通过这个路由绑定，来获取消息
pomelo.on('addEntities', function(data) {
  // ...
});
```

###5. 离开游戏
就是在玩家离开游戏时，`connector` 服务器会先收到断开的消息，这时，它需要在 `area` 服务器中将用户剔除，并广播消息给其他在线玩家。
因为服务器之间的进程都是独立的，所以这就涉及到一个 RPC 调用，好在 Pomelo 框架对 RPC 做了很好的封装，做法如下：
`area` 服务器想要提供一系列的 Remote 接口供其他服务器进程调用，只需要在 `servers/area` 目录下，创建一个 `remote` 目录，在这个目录下的文件暴露出的接口，都可以作为 RPC 调用接口。
比如，玩家离开：

```javascript
// connector 中对 session 绑定事件，当 session 关闭时，触发事件
session.on('closed', onUserLeave.bind(null, self.app));

var onUserLeave = function (app, session, reason) {
  if (session && session.uid) {
    // rpc 调用
    app.rpc.area.playerRemote.playerLeave(session, {playerId: session.get('playerId'), areaId: session.get('areaId')}, null);
  }
};
```
对应的 `area/remote/playerRemote.js` 中 `playerLeave` 方法

```javascript
exports.playerLeave = function(args, cb) {
  // 发出通知
  area.getChannel().pushMessage({route: 'onUserLeave', code: consts.MESSAGE.RES, playerId: playerId});
  // ...
};
```
这样就轻易的完成了一个跨进程的调用

##数据压缩
pomelo 0.3 版本开始增加了传输数据的压缩特性，数据采用 protobuf 方式压缩，二进制格式传输，大幅降低了网络传输流量。

数据压缩参考 [Pomelo 数据压缩协议](https://github.com/NetEase/pomelo/wiki/Pomelo-%E6%95%B0%E6%8D%AE%E5%8E%8B%E7%BC%A9%E5%8D%8F%E8%AE%AE)