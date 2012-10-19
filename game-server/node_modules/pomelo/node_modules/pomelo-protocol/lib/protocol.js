(function (exports, global) {

	var Protocol = exports;
 
	var HEADER = 5;

	var Message = function(id,route,body){
	    this.id = id;
	    this.route = route;
	    this.body = body;
	};

/**
 *
 * pomele client message encode
 *
 * @param id message id;
 * @param route message route
 * @param msg message body
 *
 * return string message for socket.io
 *
 */
Protocol.encode = function(id,route,msg){
    var msgStr = JSON.stringify(msg);
    if (route.length>255) { throw new Error('route maxlength is overflow'); }
    var byteArray = new Uint16Array(HEADER + route.length + msgStr.length);
    var index = 0;
    byteArray[index++] = (id>>24) & 0xFF;
    byteArray[index++] = (id>>16) & 0xFF;
    byteArray[index++] = (id>>8) & 0xFF;
    byteArray[index++] = id & 0xFF;
    byteArray[index++] = route.length & 0xFF;
    for(var i = 0;i<route.length;i++){
        byteArray[index++] = route.charCodeAt(i);
    }
    for (var i = 0; i < msgStr.length; i++) {
        byteArray[index++] = msgStr.charCodeAt(i);
    }
    return bt2Str(byteArray,0,byteArray.length);
};




/**
 *
 *
 * pomelo client message decode
 *
 * @param msg string data to decode
 *
 * return Message Object
 */
Protocol.decode = function(msg){
    var idx, len = msg.length, arr = new Array( len );
    for ( idx = 0 ; idx < len ; ++idx ) {
        arr[idx] = msg.charCodeAt(idx);
    }
    var index = 0;
    var buf = new Uint16Array(arr);
    var id = ((buf[index++] <<24) | (buf[index++])  << 16  |  (buf[index++]) << 8 | buf[index++]) >>>0; 
    var routeLen = buf[HEADER-1];
    var route = bt2Str(buf,HEADER, routeLen+HEADER);
    var body = bt2Str(buf,routeLen+HEADER,buf.length);  
    return new Message(id,route,body);
};

/**
 * convert Array to string
 *
 * @param byteArray arraydata
 * @param start start index
 * @param edn end index
 *
 */
var bt2Str = function(byteArray,start,end) {
    var result = "";
    for(var i = start; i < byteArray.length && i<end; i++) {
        result = result + String.fromCharCode(byteArray[i]);
    };
    return result;
}

})('object' === typeof module ? module.exports : (this.Protocol = {}), this);

