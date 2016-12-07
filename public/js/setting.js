angular.module("lamechat").controller('Setting', ['$scope', 'store','SettingsService',
    function ($scope, store,SettingsService) {
        $scope.settings =SettingsService.getSettings();

        $scope.change = function(isNotify){
            SettingsService.changeSettings(isNotify);
        };
    }]);