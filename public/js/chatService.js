/**
 * Created by shara on 02/12/2016.
 */
angular.module("lamechat").factory("ChatService",['$http','LoginService',function($http,loginService){
    function sync(callback){
        loginService.getChatList(function(data){
            console.log("chatService",data);
            if(data)
            {
                $http.get('/api/chatHist/'+data.chat_ids[0].chat_id)
                    .then(function(response){
                        callback &&  callback(response.data.chatHistory);
                    });
            }
        })

    }
    return {
        sync:sync
    }

}]);