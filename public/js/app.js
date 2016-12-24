(function () {
    angular.module('lamechat', ['ui.router', 'angular-jwt', 'angular-storage', 'ngAnimate', 'ui.bootstrap', 'ngMessages'])
        .config(function ($stateProvider, $httpProvider, $urlRouterProvider, jwtInterceptorProvider, jwtOptionsProvider) {
            jwtInterceptorProvider.tokenGetter = function (store) {
                return store.get('jwt');
            };

            jwtOptionsProvider.config({
                authPrefix: ""
            });

            $urlRouterProvider.otherwise('/');

            $httpProvider.interceptors.push('jwtInterceptor');

            $stateProvider.state({
                name: 'login',
                url: "/",
                controller: 'Login',
                templateUrl: 'view/login.html'
            }).state({
                name: 'chat',
                url: "/chat",
                controller: 'Chat',
                templateUrl: 'view/chat.html',
                data: {
                    requiresLogin: true
                }
            })
        })
        .run(function ($rootScope, $state, store, jwtHelper, $location) {
            $rootScope.$on('$stateChangeStart', function (e, to) {
                if (to.data && to.data.requiresLogin) {
                    if (!store.get('jwt') || jwtHelper.isTokenExpired(store.get('jwt'))) {
                        e.preventDefault();
                        $state.go('login');
                    }
                }
            });
            $rootScope.isActive = function (viewLocation) {
                return viewLocation === $location.path();
            };
        });
})();