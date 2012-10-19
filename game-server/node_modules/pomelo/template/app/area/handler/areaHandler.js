var exp = module.exports;

exp.createPlayer = function(req, session) {
    var user = req.username;
    var pwd = req.password;
    var num = (user.length + pwd.length) %2;
    session.response({route:req.route, area:num});
};
