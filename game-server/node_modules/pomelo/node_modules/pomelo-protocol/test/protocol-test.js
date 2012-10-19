var should = require('should');
var protocol = require('../lib/protocol');

describe(' encode Test ',function() {
    it(' normal test',function() {
        var msg = {'name':'pomelo'};
        var route = 'connect';
        var id = 4294967293;
        var buf = protocol.encode(id,route,msg);
        buf.charCodeAt(0).should.equal(0xff);
        buf.charCodeAt(4).should.equal(7);
        buf.length.should.equal(5+route.length+JSON.stringify(msg).length);
        //console.log(buf.toString('ascii',0,buf.length));
    });
});

describe(' Decode Test ',function() {
    it (' normal test',function() {
        var msg = {'name':'pomelo'};
        var route = 'connect';
        var id = 4294967293;
        var buf = protocol.encode(id,route,msg);
        var dmsg = protocol.decode(buf);
        //console.log(dmsg.id);
        dmsg.id.should.equal(4294967293);
    });
});


describe(' Chinese message Test ',function() {
    it (' normal test',function() {
        var msg = {'name':'看了v不'};
        var route = 'connect';
        var id = 4294967294;
        var str = protocol.encode(id,route,msg);
        var dmsg = protocol.decode(str);
        dmsg.id.should.equal(4294967294);
    });
});

















