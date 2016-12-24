angular.module("lamechat").factory("LoginService",['$http','store','jwtHelper',function($http,store,jwtHelper){
    function login(username,password,callback){
        $http.post('/api/authenticate',{email:username,password:password})
        .then(function(response){
            var token = response && response.data && response.data.token;
            if( token && token.indexOf("JWT") == 0)
            store.set('jwt',token);
            callback(true);
        },function(){
           alert("Failed to authenticate"); 
            callback(false);
        });
    }

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
                .then(function(response){
                    console.log(response.data);
                    callback && callback(response.data);
                },function(){
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