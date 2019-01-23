(function () {
    'use strict';

    angular
    .module('app')
    .controller('ErrorController', ErrorController);

    ErrorController.$inject = ['$state', '$scope', 'dialogs', 'blockUI', 'settingsService', 'userService', 'dataService', '$ocLazyLoad', 'apiConfig', 'localStorageService'];

    function ErrorController($state, $scope, dialogs, blockUI, settingsService, userService, dataService, $ocLazyLoad, apiConfig, localStorageService) {
        /* jshint validthis:true */
        var vm = this;
        vm.title = 'ErrorController';

        activate();

        function activate() {

            if (CustomerConnect.Config.SessionIdOld) {
                var sessionId = CustomerConnect.Config.SessionIdOld;
                apiConfig.setSessionId(sessionId);
                CustomerConnect.Config.SessionId = sessionId;
                localStorageService.set(CustomerConnect.Config.Tenant + '_token', sessionId);

                window.location.reload();
            }

            $scope.Login = function () {
                $state.go('login');
            };


        }
    };
})();