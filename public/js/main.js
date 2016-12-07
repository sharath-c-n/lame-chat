angular.module("lamechat").controller('Home', ['$scope', '$http', '$window', 'SocketService', 'LoginService',
    'SettingsService','$uibModal','ChatService',
    function ($scope, $http, $window, socket, LoginService, SettingsService,$uibModal,ChatService) {
        var regex = /(&zwj;|&nbsp;)/g;
        var dev = true;
        var friendList;
        var usersTyping = [];
        var focus=true;
        var unread = 0;
        var callback = {
            onMessage: onMessage,
            onConnLoose: onConnLoose,
            onConnect: updateInfo
        };
        $scope.connected = false;
        $scope.settingInstance = function(){
            $uibModal.open({
            animation: true,
            templateUrl: '/view/setting.html',
            controller: 'Setting'
        });
        };
        $scope.helpInstance = function(){
            var instance = $uibModal.open({
            animation: true,
            templateUrl: '/view/help.html',
            controller: 'Setting'
        });
        };

        $scope.logout = function () {
            LoginService.logout();
            $window.location = "/";
        };
        function init() {
            $scope.username = LoginService.getUserName();
            $scope.username = $scope.username.slice(0, $scope.username.indexOf('@'));
            socket.connect(callback, $scope.username,LoginService.getUserObj());
            ChatService.sync(syncCallback);
        }

        function syncCallback(data){
            if(data){
                if(data.length > 10){
                    data = data.slice(data.length - 9);
                }
                data.forEach(function(value){
                    var mid = Date.now();
                    displayChat(value.from,value.message,mid,value._id);
                    updateStyle(mid);
                    if (SettingsService.getSettings().inline && value.message) {
                        var m = value.message.match(/(https?|ftp):\/\/[^\s/$.?#].[^\s]*/gmi);
                        if (m) {
                            m.forEach(function (e) {
                                testImage(e, mid, e);
                            });
                        }
                    }
                });
                var panel =  $('#panel');
                panel.animate({scrollTop: panel.prop('scrollHeight')}, 500);

            }
        }

        /**
         *Called when the socket connection is established
         *Here we are updating the user information (name)
         **/
        function updateInfo() {
            $scope.connected = true;
            updateBar('');
        }

        function onMessage(e) {
            var data = JSON.parse(e.data);
            if (dev) {
                console.log(data);
            }
            if (data.type == 'typing') {
                var string;
                if (data.user != $scope.username) {
                    if (data.typing) {
                        usersTyping.push(data.user);
                    }
                    else {
                        usersTyping.splice(usersTyping.indexOf(data.user), 1);
                    }
                    if (usersTyping.length == 1) {
                        string = usersTyping + ' is writing...';
                    }
                    else if (usersTyping.length > 4) {
                        string = 'Several people are writing...';
                    }
                    else if (usersTyping.length > 1) {
                        var lastUser = usersTyping.pop();
                        string = usersTyping.join(', ') + ' and ' + lastUser + ' are writing...';
                        usersTyping.push(lastUser);
                    }
                    else {
                        string = '<br>';
                    }
                }
                return $('#typing').html(string);
            }
            if (data.type == 'server') {
                switch (data.info) {
                     case 'update':
                        showChat('info', null, data.user.oldun + ' changed its name to ' + data.user.un);
                        friendList[data.user.id] = data.user;
                        break;
                    case 'connection':
                        showChat('info', null, data.user.un  + ' connected to the server');
                        friendList[data.user.id] = data.user;
                        break;
                    case 'disconnection':
                        if (data.user.un != null) {
                            showChat('info', null, data.user.un  + ' disconnected from the server');
                        }
                        if(friendList){
                            delete friendList[data.user.id];
                        }
                        document.getElementById('users').innerHTML = Object.keys(friendList).length + ' USERS';
                        break;
                    case 'clients':
                        friendList = data.clients;
                        break;
                    case 'user':
                        user = data.client.id;
                        break;
                }
            }
            else {
                if (data.message.indexOf('@' + $scope.username) > -1) {
                    data.type = 'mention';
                }

                showChat(data.type, data.user, data.message, data.subtxt, data.mid);
            }
            if (data.type == 'global' || data.type == 'pm' || data.type == 'message') {
                if (!focus) {
                    unread++;
                    document.title = '(' + unread + ') Node.JS Chat';

                    if (SettingsService.getSettings().desktop) {
                        desktopNotif(data.user + ': ' + data.message);
                    }
                }
            }
        }

        function desktopNotif(message) {
            if(!Notification) {
                return;
            }

            var notification = new Notification('You\'ve got a new message', {
                icon: 'http://i.imgur.com/ehB0QcM.png',
                body: message
            });

            notification.onclick = function() {
                window.focus();
                notification.close();
            }
        }

        /**
         * Called when the connection to server is lost
         **/
        function onConnLoose() {
            $scope.connected = false;
            $scope.typing = false;
            friendList = [];
            updateBar('Connection lost, reconnecting...');
            timer = setTimeout(function () {
                socket.connect(callback, $scope.username);
            }, 1500);
        }

        function updateBar(msg){
            $('#message-to-send').val(msg);
        }

        $scope.sendMessage = function (event) {
            if ((event.type === 'keyup' && event.keyCode === 13) || event.type === 'click') {
                var ele = $('#message-to-send');
                var value = ele.val().replace(regex, ' ').trim();
                if (value.length > 0) {
                    socket.send({message:value,type: 'message'});
                    ele.val('');
                    updateTyping(false);
                }
            }
            else{
                updateTyping(true);
            }
        };

        function updateTyping(isTyping)
        {
                typing = isTyping;
                socket.send({type:"typing", typing:typing});
        }

        function showChat(type, user, message, subtxt, mid) {
            if ( type == 'info' || type == 'group') {
                user = 'System';
            }

            if (!mid) {
                mid = 'system';
            }
            if(subtxt){
                //TODO : handel private messages
            }
            if(user !== "System")
            {
                if(user == $scope.username)
                {
                    $('.chat-history ul').append('<li><div class="message-data align-left"><span class="message-data-time" >'+
                        getTime()+'</span>'+'<span class="message-data-name" > me</span>'+
                        '</div><div  data-mid="' + mid + '" class="message my-message float-left">'+ message+ '</div></li>');
                }
                else
                {
                    $('.chat-history ul').append('<li><div class="message-data align-right"><span class="message-data-time" >'+
                        getTime()+'</span>'+'<span class="message-data-name" > '+ user+'</span>'+
                        '</div><div  data-mid="' + mid + '" class="message other-message float-right">'+ message+ '</div></li>');
                }
            }

            else {
                    $('.chat-history ul').append('<li><div data-mid="' + mid + '" class="' + type + '""><span class="name"><b><a class="namelink" href="javascript:void(0)">' + user + '</a></b></span><span class="timestamp">'+getTime() +'</span><span class="msg">' + message + '</span></div></li>');
                    return;
            }
            var panel =  $('#panel');
            panel.animate({scrollTop: panel.prop('scrollHeight')}, 500);
            updateStyle(mid);

            if (SettingsService.getSettings().inline && message) {
                var m = message.match(/(https?|ftp):\/\/[^\s/$.?#].[^\s]*/gmi);
                if (m) {
                    m.forEach(function (e) {
                            testImage(e, mid, e);
                    });
                }
            }
        }
        function displayChat(user,message,mid,time)
        {
            if(user == $scope.username)
            {
                $('.chat-history ul').append('<li><div class="message-data align-left"><span class="message-data-time" >'+
                    getTime(time)+'</span>'+'<span class="message-data-name" > me</span>'+
                    '</div><div  data-mid="' + mid + '" class="message my-message float-left">'+ message+ '</div></li>');
            }
            else
            {
                $('.chat-history ul').append('<li><div class="message-data align-right"><span class="message-data-time" >'+
                    getTime(time)+'</span>'+'<span class="message-data-name" > '+ user+'</span>'+
                    '</div><div  data-mid="' + mid + '" class="message other-message float-right">'+ message+ '</div></li>');
            }
        }


        function updateStyle(mid) {
             $('.chat-history ul').linkify({
                 target: "_blank"
             });
            $('div[data-mid=' + mid + ']').find('a').attr('target','_blank');
            var element = $("[data-mid="+mid+"]");
            if (element.html() != undefined) {
                if (SettingsService.getSettings().emoji) {
                    element.html(emojione.shortnameToImage(element.html()));
                }
            }
        }

        function getTime(time) {
            if(!time){
                time = new Date()
            }
            else{
                time = new Date(time);
            }
            return time.toLocaleTimeString().replace(/([\d]+:[\d]{2})(:[\d]{2})(.*)/, "$1$3");
        }
        

        function testImage(url, mid, oldUrl) {
            var img = new Image();
            var panel = $('#panel');
            img.onload = function() {
                $('div[data-mid=' + mid + '] a[href="' + oldUrl.replace('https://', 'http://') + '"]').html(img);
                panel.animate({scrollTop: panel.prop('scrollHeight')}, 500);
            };
            img.src = url;
        }
        init();
        $window.onfocus = function() {
            document.title = 'Lame Chat';
            focus = true;
            unread = 0;
        };


        $window.onblur = function() {
            focus = false;
        };
    }]);