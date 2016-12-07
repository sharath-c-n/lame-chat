angular.module("lamechat").factory("LoginService",['$http','store','jwtHelper',function($http,store,jwtHelper){
    var chatList = null;
    function login(username,password,callback){
        $http.post('/api/authenticate',{email:username,password:password})
        .success(function(data){
            store.set('jwt',data.token);
            console.log(data);
            callback(true);
        }).error(function(){
           alert("Failed to authenticate"); 
            callback(false);
        });
    };

    function getUserName(){
        if(store.get('jwt')){
            return jwtHelper.decodeToken(store.get('jwt')).email;
        }
        return null;
    }
    function getUserObj(){
        if(store.get('jwt')){
            return jwtHelper.decodeToken(store.get('jwt'));
        }
        return null;
    }
    function logout(){
        store.remove('jwt');
    }

    function getChatList(callback){
        if(store.get('jwt')){
            $http.get('/api/chatList')
                .success(function(data){
                    chatList = data;
                    console.log(chatList);
                    callback && callback(chatList);
                }).error(function(){
                callback && callback(null);
            });
        }
        return null;
    }

    return {
        login : login,
        logout:logout,
        getUserName:getUserName,
        getChatList:getChatList,
        getUserObj:getUserObj
    };
}]);