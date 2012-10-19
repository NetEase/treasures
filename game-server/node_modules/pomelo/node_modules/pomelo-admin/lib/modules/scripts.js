/*!
 * Pomelo -- consoleModule runScript 
 * Copyright(c) 2012 fantasyni <fantasyni@163.com>
 * MIT Licensed
 */
var monitor = require('pomelo-monitor');
var logger = require('../util/log/log').getLogger(__filename);
var monitor = require('pomelo-monitor');
//var ml = require('../util/monitorLog');
var vm = require('vm');
var fs = require('fs');

var base = process.cwd() + '/scripts/';

var Module = function(app) {
    this.app = app;
	this.commands = {
        'list': list, 
        'get': get, 
        'save': save, 
        'run': run
    };
};

module.exports = Module;
module.exports.moduleId = "scripts";

var pro = Module.prototype;
 
pro.monitorHandler = function(agent, msg, cb) {
    var context = vm.createContext({
        app: this.app,
        os: require('os'),
        fs: require('fs'),
        process: process,
        monitor: monitor,
        logger: logger,
        monitorLog: logger
    });

    cb(null, vm.runInContext(msg.script, context));
};

pro.clientHandler = function(agent, msg, cb) {
    var fun = this.commands[msg.command];
    if(!fun || typeof fun !== 'function') {
        cb('unknown command:' + msg.command);
        return;
    }

    fun(agent, msg, cb);
};

/**
 * List server id and scripts file name
 * 
 * @param  {[type]}   agent [description]
 * @param  {[type]}   msg   [description]
 * @param  {Function} cb    [description]
 * @return {[type]}         [description]
 */
var list = function(agent, msg, cb) {
    var servers = [];
    var scripts = [];
    var idMap = agent.idMap;

    for(var sid in idMap){
        servers.push(sid);
    }

    fs.readdir(base, function(err, filenames){
        for(var i=0, l=filenames.length; i<l; i++){
            scripts.push(filenames[i]);
        }

        cb(null, {servers: servers, scripts: scripts});
    });
};

/**
 * Get the content of the script file
 * 
 * @param  {[type]}   agent [description]
 * @param  {[type]}   msg   [description]
 * @param  {Function} cb    [description]
 * @return {[type]}         [description]
 */
var get = function(agent, msg, cb) {
    var filename = msg.filename;
    if(!filename) {
        cb('empty filename');
        return;
    }

    fs.readFile(base + filename, 'utf-8', function(err, data) {
        if(err) {
            logger.error('fail to read script file:' + filename + ', ' + err.stack);
            cb('fail to read script with name:' + filename);
        }

        cb(null, data);
    });
};

/**
 * Save a script file that posted from admin console
 * 
 * @param  {[type]}   agent [description]
 * @param  {[type]}   msg   [description]
 * @param  {Function} cb    [description]
 * @return {[type]}         [description]
 */
var save = function(agent, msg, cb) {
    var filepath = base + msg.filename;

    fs.writeFile(filepath, msg.body, function(err) {
        if(err){
            logger.error('fail to write script file:' + msg.filename + ', ' + err.stack);
            cb('fail to write script file:' + msg.filename);
            return;
        }
        
        cb();
    });
};

/**
 * Run the script on the specified server
 * 
 * @param  {[type]}   agent [description]
 * @param  {[type]}   msg   [description]
 * @param  {Function} cb    [description]
 * @return {[type]}         [description]
 */
var run = function(agent, msg, cb) {
    agent.request(msg.serverId, Module.moduleId, msg, function(err, res) {
        if(err) {
            logger.error('fail to run script for ' + err.stack);
            return;
        }
        cb(null, res);
    });
};