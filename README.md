#Treasures
a tutorial demo of [pomelo](https://github.com/NetEase/pomelo)

Treasures is a simple game in order to show how to use pomelo

If you are using pomelo 0.2.x , you can check this branch [pomelo-0.2.5](https://github.com/NetEase/treasures/tree/pomelo-0.2.5)

[Demo 详细说明](https://github.com/NetEase/pomelo/wiki/Tutorial-2----Treasures)

[Demo Guide](https://github.com/NetEase/pomelo/wiki/Treasure)

## 概述
这是一篇通过一个简单的 treasure 捡宝的例子讲述如何使用 [Bearcat](https://github.com/bearcatnode/bearcat) 来快速, 高效的进行 [pomelo](https://github.com/NetEase/pomelo) game 开发  

## 起步
### 添加 bearcat

```
npm install bearcat --save
```

添加context.json, 并指定 ***scan*** 扫描路径, 来自动扫描 POJOs  
context.json
```
{
	"name": "bearcat-treasures",
	"scan": "app",
	"beans": []
}
```

修改app.js, 添加 bearcat 启动代码  
app.js
```
var contextPath = require.resolve('./context.json');
bearcat.createApp([contextPath]);

bearcat.start(function() {
  Configure(); // pomelo configure in app.js
  app.set('bearcat', bearcat);
  // start app
  app.start();
});
```

就是这么简单, bearcat 开发环境就已经搭建完毕, 之后就可以利用 bearcat 所提供的 IoC, AOP, 一致性配置等特性来编写简单, 可维护的 pomelo 应用  

## 途中
### handler, remote 交由 bearcat 管理
handler, remote 都以 POJO 的形式编写  
由于之前handler, remote在pomelo里面是通过 pomelo-loader 来管理的, 因此需要做一下适配转化  

```
module.exports = function(app) {
	return bearcat.getBean({
		id: "gateHandler",
		func: GateHandler,
		args: [{
			name: "app",
			value: app
		}],
		props: [{
			name: "dispatcher",
			ref: "dispatcher"
		}]
	});
};
```

通过适配, gateHandler 就交给了 bearcat 来进行管理, 之后 gateHandler 需要什么依赖, 仅仅在 getBean 的 metadata 配置中描述好依赖关系就行了  
上面的gateHandler例子中, 就向 bearcat 容器描述了, gateHandler 需要在构造函数中传入一个 ***app*** 对象, 在对象属性中需要一个 ***dispatcher*** 依赖  

### domain 对象编写
domain 代表着数据和模型, 包括玩家player, 宝物treasure, 移动move等等  
domain 里的数据要被序列化, 需要定义序列化方法, 比如toJSON  

entity.js
```
var EventEmitter = require('events').EventEmitter;
var util = require('util');

var id = 1;

function Entity(opts) {
	EventEmitter.call(this);
	this.opts = opts || {};
	this.entityId = id++;
	this.kindId = opts.kindId;
	this.kindName = opts.kindName;
	this.areaId = opts.areaId || 1;
	this.x = 0;
	this.y = 0;
}

util.inherits(Entity, EventEmitter);

Entity.prototype._init = function() {
	var opts = this.opts;
	if (opts.x === undefined || opts.y === undefined) {
		this.randPos();
	} else {
		this.x = opts.x;
		this.y = opts.y;
	}
}

Entity.prototype._toJSON = function() {
	return {
		x: this.x,
		y: this.y,
		entityId: this.entityId,
		kindId: this.kindId,
		kindName: this.kindName,
		areaId: this.areaId
	}
}

// random position
Entity.prototype.randPos = function() {
};

module.exports = {
	id: "entity",
	func: Entity,
	abstract: true,
	props: [{
		name: "dataApiUtil",
		ref: "dataApiUtil"
	}, {
		name: "utils",
		ref: "utils"
	}]
}
```

***entity*** 是一个抽象的bean, 意味着它只是作为子bean的模版, 并不会被实例化, 它通过对象属性依赖注入了 ***dataApiUtil*** 和 ***util***  

player.js
```
var logger = require('pomelo-logger').getLogger('bearcat-treasures', 'Player');
var bearcat = require('bearcat');
var util = require('util');

function Player(opts) {
  this.opts = opts;
  this.id = opts.id;
  this.type = null;
  this.name = opts.name;
  this.walkSpeed = 240;
  this.score = opts.score || 0;
  this.target = null;
}

Player.prototype.init = function() {
  this.type = this.consts.EntityType.PLAYER;
  var Entity = bearcat.getFunction('entity');
  Entity.call(this, this.opts);
  this._init();
}

Player.prototype.addScore = function(score) {
  this.score += score;
};

Player.prototype.toJSON = function() {
  var r = this._toJSON();

  r['id'] = this.id;
  r['type'] = this.type;
  r['name'] = this.name;
  r['walkSpeed'] = this.walkSpeed;
  r['score'] = this.score;

  return r;
};

module.exports = {
  id: "player",
  func: Player,
  scope: "prototype",
  parent: "entity",
  init: "init",
  args: [{
    name: "opts",
    type: "Object"
  }],
  props: [{
    name: "consts",
    ref: "consts"
  }]
}
```

player 是 entity 的一个子类, 它通过在metadata配置中的 ***parent*** 继承了 entity prototype 里的方法  
player 的scope是 prototype 的, 并且需要定义一个 init 方法, 来调用 entity 的构造函数以及 entity 的 init 方法 ***_init***  

```
 var Entity = bearcat.getFunction('entity');
 Entity.call(this, this.opts);
 this._init();
```
这里通过 bearcat.getFunction 来拿到 entity 的构造函数来进行调用  

### 使用 domain
在没有bearcat的情况下, 使用domain需要自己先require进来, 然后再 new domain(), 现在你可以直接通过 getBean 来得到相应 domain 的实例  

playerHandler enterScene  
```
PlayerHandler.prototype.enterScene = function(msg, session, next) {
  var role = this.dataApiUtil.role().random();
  var player = bearcat.getBean('player', {
    id: msg.playerId,
    name: msg.name,
    kindId: role.id
  });

  player.serverId = session.frontendId;
  if (!this.areaService.addEntity(player)) {
    logger.error("Add player to area faild! areaId : " + player.areaId);
    next(new Error('fail to add user into area'), {
      route: msg.route,
      code: this.consts.MESSAGE.ERR
    });
    return;
  }

  var r = {
    code: this.consts.MESSAGE.RES,
    data: {
      area: this.areaService.getAreaInfo(),
      playerId: player.id
    }
  };

  next(null, r);
};
```  

```
var player = bearcat.getBean('player', {
    id: msg.playerId,
    name: msg.name,
    kindId: role.id
  });
```

player 通过 bearcat.getBean 拿到

### domain 事件的处理
移动和捡宝是通过 event 事件来处理的, 在一个 tick 时间内, 当移动到宝物的捡宝范围之内, 就会出发 ***pickItem*** 事件  

```
Move.prototype.update = function() {
  var time = Date.now() - this.time;
  var speed = this.entity.walkSpeed;
  var moveLength = speed * time / 1000;
  var dis = getDis(this.entity.getPos(), this.endPos);
  if (dis <= moveLength / 2) {
    this.finished = true;
    this.entity.setPos(this.endPos.x, this.endPos.y);
    return;
  } else if (dis < 55 && this.entity.target) {
    this.entity.emit('pickItem', {
      entityId: this.entity.entityId,
      target: this.entity.target
    });
  }
  var curPos = getPos(this.entity.getPos(), this.endPos, moveLength, dis);
  this.entity.setPos(curPos.x, curPos.y);

  this.time = Date.now();
};
```

触发时间后, 就向channel广播捡宝这个事件  
```
player.on('pickItem', function(args) {
    var player = self.getEntity(args.entityId);
    var treasure = self.getEntity(args.target);
    player.target = null;
    if (treasure) {
      player.addScore(treasure.score);
      self.removeEntity(args.target);
      self.getChannel().pushMessage({
        route: 'onPickItem',
        entityId: args.entityId,
        target: args.target,
        score: treasure.score
      });
    }
  });
```

## areaService 编写
areaService 里面维护着当前area里面的玩家, 排名, 宝物等数据  
它在tick时间内, 向channel广播更新着area里面的最新数据  

```
AreaService.prototype.tick = function() {
  //run all the action
  this.actionManagerService.update();
  this.entityUpdate();
  this.rankUpdate();
}
```

entityUpdate 更新着area里面的entity情况  
```
AreaService.prototype.entityUpdate = function() {
  if (this.reduced.length > 0) {
    this.getChannel().pushMessage({
      route: 'removeEntities',
      entities: this.reduced
    });
    this.reduced = [];
  }
  if (this.added.length > 0) {
    var added = this.added;
    var r = [];
    for (var i = 0; i < added.length; i++) {
      r.push(added[i].toJSON());
    }

    this.getChannel().pushMessage({
      route: 'addEntities',
      entities: r
    });
    this.added = [];
  }
};
```

## 总结
在bearcat的统一管理协调下, 去除了烦人的require直接依赖关系, 可以放心大胆的进行编码甚至重构, bearcat 里面的任一组件都被有序的管理维护着, 使用时不再是一个个单一的个体, 而是一个集体  