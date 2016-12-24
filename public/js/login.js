angular.module("lamechat").controller('Login',['$scope','LoginService','$state','$http',function($scope,LoginService,$state,$http)
{
    $scope.loginFail=false;
    $scope.signupFail=false;
    var isLogin = true;

    $scope.login = function(){
        LoginService.login($scope.username,$scope.password,function(res){
            if(res){
                $state.go("chat");
            }
            else{
                $scope.loginFail=true;
            }
        });
    };

    $scope.showSignup= function() {
        clearForm();
        isLogin=false;
        $('.container').stop().addClass('active');
    };

    $scope.showLogin = function() {
        $scope.signupFail = false;
        isLogin = true;
        clearForm();
        $('.container').stop().removeClass('active');
    };


    function clearForm(){
        $scope.message = "";
        $scope.user = {
            username: "",
            email: "",
            password: "",
            confirmPassword: ""
        };
    }

    $scope.submit = function (isValid) {
        if(isLogin)
            return;
            if (isValid) {
            $http.post('/api/register', {
                email: $scope.user.email,
                password: $scope.user.password,
                name: $scope.user.username
            }).then(function (data) {
                console.log(data);
                if(data && data.success){
                    clearForm();
                    $scope.showLogin();
                }
                else {
                    $scope.signupFail = true;
                    $scope.message = data.message;
                }
            },function () {
                console.log("Failed to register")
            });
        } else {
            $scope.signupFail = true;
            $scope.message = "There are still invalid fields";
        }
    };
}]);


angular.module("lamechat").directive("compareTo", function() {
    return {
        require: "ngModel",
        scope: {
            otherModelValue: "=compareTo"
        },
        link: function(scope, element, attributes, ngModel) {

            ngModel.$validators.compareTo = function(modelValue) {
                return modelValue == scope.otherModelValue;
            };

            scope.$watch("otherModelValue", function() {
                ngModel.$validate();
            });
        }
    };

    clearForm();
});