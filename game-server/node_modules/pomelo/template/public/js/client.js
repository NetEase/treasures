var pomelo = window.pomelo;
var name;
var pwd;

function showLogin() {
    $("#loginPanel").show();
    $("#userPanel").hide();
}
;

function showUser() {
    $("#loginPanel").hide();
    $("#userPanel").show();
}
;

$(document).ready(function () {

    showLogin();
    $("#login").click(function () {
        name = $("#loginUser").attr("value");
        pwd = $("#loginPwd").attr("value");
        if (!name) {
            $("#loginInfo").text("Name cannot be none!");
            return;
        }
        pomelo.init({socketUrl:window.__front_address__, log:true}, function () {
            pomelo.request({
                route:"connector.loginHandler.login",
                username:name, password:pwd
            }, function (data) {
                showUser();
                $("#userInfo").text("Welcome to pomelo: " + data.user + ". Your password is: " + data.pwd);
                enterArea();
            });
        });
    });
});

function enterArea() {
    pomelo.request({
        route:"area.areaHandler.createPlayer", username:name, password:pwd}, function (data) {
        $("#areaInfo").text("You enter into: area " + data.area);
    });
}
