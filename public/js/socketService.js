/**
 * @author Sharath
 */
angular.module("lamechat").service("SocketService", ['$http', '$window', function ($http, $window) {
    var socket;
    var ctlCallbacks = {};
    var userName;
    var userObj;
    var ping;
    this.connect = function (callbacks,username,userobj) {
        ctlCallbacks = callbacks;
        userObj = userobj;
        userObj.userName = username;
        userName = username;
        if(!socket) {
            var protocol;
            if ($window.location.protocol === 'https:') {
                protocol = 'wss://';
            }
            else {
                protocol = 'ws://';
            }
            socket = new $window.WebSocket(protocol + $window.location.host + '/socket/websocket');
        }
        else
        {
            socket.onmessage = ctlCallbacks.onMessage;
            ctlCallbacks.onConnect()
        }
        socket.onopen = onOpen;
        socket.onclose = onClose;
        socket.onmessage = ctlCallbacks.onMessage;
    };

    function onOpen() {
        ping = setInterval(function () {
            socket.send(JSON.stringify({
                type: 'ping'
            }));
        }, 50 * 1000);
        console.info('Connection established..');
        socket.send(JSON.stringify({
            user: userObj,
            type: 'update'
        }));
        ctlCallbacks.onConnect && ctlCallbacks.onConnect();
    }

    function onClose() {
        console.log("Connection to server lost!!!");
        clearInterval(ping);
        socket = null;
        ctlCallbacks.onConnLoose && ctlCallbacks.onConnLoose();
    }

    this.send = function (data) {
        if (socket) {
            socket.send(JSON.stringify(data));
        }
    };
    this.updateInfo = function () {
        if (socket) {
            socket.send(JSON.stringify({
                user: username
                , type: 'update'
            }));
        }
    };

    this.getTime = function () {
        var now = new Date();
        var time = [now.getHours(), now.getMinutes(), now.getSeconds()];
        for (var i = 0; i < 3; i++) {
            if (time[i] < 10) {
                time[i] = '0' + time[i];
            }
        }
        return time.join(':');
    };
}]);