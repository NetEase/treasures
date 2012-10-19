#pomelo-protocol
pomelo-protocol is simple tool to encode request to fixed format string.

Until current socket.io  version (0.9.6), it can only support transport string
message to socket.io server. And if you emit message from fronted server to
other many backed server,the message should be encode(decode) many times.if it
occurs in very common situation and frequently, the CPU cost will be in a hight
rate. We need simple send message with string and no need extra encode(decode)
cost in connect server. 

pomelo-protocol encode the message for the param (id,route,body), after call
encode function.it should return the following format message;

-------------------------------------------------
| 4 bytes | 1 byte(route length) | route | body |
-------------------------------------------------

As the same, if it's decode function is called with the above format
message,it should return the message object with id,route,body field.


##Installation
```
npm install pomelo-protocol
```

##Usage
``` javascript

var protocol = require('pomelo-protocol');

var msg = {'name':'看了不'};
var route = 'connect';
var id = 4294967294;
var str = protocol.encode(id,route,msg);
var dmsg = protocol.decode(str);


``` 

##API
###protocol.encode(id,route,body)
encode the message to the fixed format
####Arguments
+ id - message id. 
+ route - message route, the server invoke path. 
+ body -  real message content 

###protocol.decode(message)
decode string message to message object
####Arguments
+ message - the content should be decode
