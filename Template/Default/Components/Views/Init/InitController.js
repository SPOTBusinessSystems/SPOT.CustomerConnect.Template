(function () {
    'use strict';

    angular
    .module('app')
    .controller('InitController', InitController);

    InitController.$inject = ['$state', '$stateParams', '$scope', 'localStorageService', 'userService', 'dataService', 'dialogs', 'apiConfig'];


    function InitController($state, $stateParams, $scope, localStorageService, userService, dataService, dialogs, apiConfig) {

        if (localStorageService.get(CustomerConnect.Config.Tenant + '_token') == null) {
            $state.go('login', { returnState: $stateParams.returnState });
            return;
        }

        CustomerConnect.Config.SessionId = localStorageService.get(CustomerConnect.Config.Tenant + '_token');
        apiConfig.setSessionId(CustomerConnect.Config.SessionId);



        var promiseC = dataService.customer.getCustomer();
        var promiseM = dataService.user.getMessages();

        Promise.all([promiseC, promiseM]).then(function (values) {
            var vc = values[0];

            if (vc.Failed) {
                localStorageService.remove(CustomerConnect.Config.Tenant + '_token');
                $state.go('login');
                return;
            }
            userService.setCustomer(vc.ReturnObject);

            var vm = values[1];
            if (vm.Failed)
                dialogs.error('Messages Error', 'Unable to load messages.');
            else
                userService.setMessages(vm.ReturnObject);

            if ($stateParams.returnState)
                $state.go($stateParams.returnState);
            else
                $state.go('account');

        });
    };


})();