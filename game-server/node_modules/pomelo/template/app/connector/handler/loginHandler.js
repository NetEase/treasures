var exp = module.exports;

exp.login = function(req, session) {
	var user = req.username;
	var pwd = req.password;
	session.response({route:req.route, user:user, pwd:pwd});
};
