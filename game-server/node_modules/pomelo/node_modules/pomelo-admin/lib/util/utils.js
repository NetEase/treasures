var util = require('util');

var utils = module.exports;

/**
 * 调用回调函数
 *
 * 如果cb非空，则将之后的参数作为cb的参数调用cb
 */
utils.invokeCallback = function (cb) {
    if (!!cb && typeof cb === 'function') {
        cb.apply(null, Array.prototype.slice.call(arguments, 1));
    }
};

/*
 * Date format
 */
utils.format = function (date, format) {
    format = format || 'MMddhhmm';
    var o = {
        "M+":date.getMonth() + 1, //month
        "d+":date.getDate(), //day
        "h+":date.getHours(), //hour
        "m+":date.getMinutes(), //minute
        "s+":date.getSeconds(), //second
        "q+":Math.floor((date.getMonth() + 3) / 3), //quarter
        "S":date.getMilliseconds() //millisecond
    }
    if (/(y+)/.test(format)) format = format.replace(RegExp.$1,
        (date.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)if (new RegExp("(" + k + ")").test(format))
        format = format.replace(RegExp.$1,
            RegExp.$1.length == 1 ? o[k] :
                ("00" + o[k]).substr(("" + o[k]).length));
    return format;
};