angular.module("lamechat").service("SettingsService", ['store', '$window', function (store, $window) {
    var settings;
    this.getSettings = function () {
        if(settings){
            return settings;
        }
        if (!store.get('settings')) {
            settings = {
            'name': null
            , 'emoji': true
            , 'greentext': true
            , 'inline': true
            , 'desktop': false
        };
                store.set('settings',settings);
        }
        else {
            settings = store.get('settings');
        }
        return settings;
    };

    this.changeSettings = function(isDesktopNotif){
        if(isDesktopNotif)
        {
            if(settings.desktop){
                if(Notification.permission !== 'granted') {
                    Notification.requestPermission().then(function(e){
                        console.log(e);
                    });
                }
            }
        }
        store.set('settings', settings);
    };
}]);