// require json files
var area = require('../../config/data/area');
var role = require('../../config/data/role');
var treasure = require('../../config/data/treasure');

/**
 * Data model `new Data()`
 *
 * @param {Array}
 */
var Data = function(data) {
  var fields = {};
  data[1].forEach(function(i, k) {
    fields[i] = k;
  });
  data.splice(0, 2);

  var result = {}, ids = [], item;
  data.forEach(function(k) {
    item = mapData(fields, k);
    result[item.id] = item;
    ids.push(item.id);
  });

  this.data = result;
  this.ids = ids;
};

/**
 * map the array data to object
 *
 * @param {Object}
 * @param {Array}
 * @return {Object} result
 * @api private
 */
var mapData = function(fields, item) {
  var obj = {};
  for (var k in fields) {
    obj[k] = item[fields[k]];
  }
  return obj;
};

/**
 * find items by attribute
 *
 * @param {String} attribute name
 * @param {String|Number} the value of the attribute
 * @return {Array} result
 * @api public
 */
Data.prototype.findBy = function(attr, value) {
  var result = [];
  //console.log(' findBy ' + attr + '  value:' + value + '  index: ' + index);
  var i, item;
  for (i in this.data) {
    item = this.data[i];
    if (item[attr] == value) {
      result.push(item);
    }
  }
  return result;
};

/**
 * find item by id
 *
 * @param id
 * @return {Obj}
 * @api public
 */
Data.prototype.findById = function(id) {
  return this.data[id];
};

Data.prototype.random = function() {
  var length = this.ids.length;
  var rid =  this.ids[Math.floor(Math.random() * length)];
  return this.data[rid];
};

/**
 * find all item
 *
 * @return {array}
 * @api public
 */
Data.prototype.all = function() {
  return this.data;
};

module.exports = {
  area: new Data(area),
  role: new Data(role),
  treasure: new Data(treasure)
};

