(function () {
    if (typeof Object.create !== 'function') {
        Object.create = function (o) {
            function F() {
            }

            F.prototype = o;
            return new F();
        };
    }

    var root = window;
    var pomelo = Object.create(EventEmitter.prototype); // object extend from object
    root.pomelo = pomelo;
    var socket = null;
    var id = 1;
    var callbacks = {};

    pomelo.init = function (params, cb) {
        pomelo.params = params;
        params.debug = true;

        //socket = io.connect(params.socketUrl, {'force new connection': true, reconnect: true});

        var url = window.location.hostname;

        //var url = '192.168.145.33';
        socket = io.connect('http://' + url + ':3050', {'force new connection':true, reconnect:true});
        socket.on('connect', function () {
            console.log('[pomeloclient.init] websocket connected!');
            if (cb) {
                cb(socket);
            }
        });

        socket.on('reconnect', function () {
            console.log('reconnect');
        });

        socket.on('message', function (data) {
            if (params.debug) {
                //console.log('[pomeloclient.received]websocket onmessage:' + data);
            }
            data = JSON.parse(data);
            if (data instanceof Array) {
                processMessageBatch(pomelo, data);
            } else {
                processMessage(pomelo, data);
            }
        });

        socket.on('disconnect', function (reason) {
            console.log('disconnect reason:');
            console.log(reason);
            pomelo.emit('disconnect', reason);
        });
    };


    pomelo.pushMessage = function (msg, cb) {
        if (pomelo.debug) {
            console.log('[pomeloclient.pushMessage], msg: ' + JSON.stringify(msg));
        }
        this.request(msg, cb);
    };

    pomelo.request = function (msg, cb) {
        if (!msg) {
            return;
        }
        msg = filter(msg);
        id++;
        callbacks[id] = cb;
        var sg = Protocol.encode(id, msg.route, msg);
        socket.send(sg);
    };

    pomelo.notify = function (msg) {
        this.request(msg);
    };

    var processMessage = function (pomelo, msg) {
        var route;
        if (msg.id) {
            //if have a id then find the callback function with the request
            var cb = callbacks[msg.id];
            if (!cb) {
                console.log('[pomeloclient.processMessage] cb is null for request:');
                console.log(msg);
                processCall(msg.body);
                return;
            }
            delete callbacks[msg.id];
            if (typeof cb !== 'function') {
                console.log('[pomeloclient.processMessage] cb is not a function for request ' + msg.id);
                return;
            }

            cb(msg.body);
            return;
        }

        // server push message or old format message
        processCall(msg);

        //if no id then it should be a server push message
        function processCall(msg) {
            var route = msg.route;
            if (!!route) {
                if (!!msg.body) {
                    var body = msg.body.body;
                    if (!body) {
                        body = msg.body;
                    }
                    pomelo.emit(route, body);
                } else {
                    pomelo.emit(route, msg);
                }
            } else {
                pomelo.emit(msg.body.route, msg.body);
            }
        }
    };

    var processMessageBatch = function (pomelo, msgs) {
        for (var i = 0, l = msgs.length; i < l; i++) {
            processMessage(pomelo, msgs[i]);
        }
    };

    function filter(msg) {
        if (msg.route.indexOf('area.') === 0) {
            msg.areaId = pomelo.areaId;
        }

        msg.timestamp = Date.now();
        return msg;
    }

})();
