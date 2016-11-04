(function () {
    'use strict';

    angular
    .module('app')
    .controller('ReminderController', ReminderController);

    ReminderController.$inject = ['$scope','blockUI','dialogs','$stateParams','$state','userService','dataService'];

    function ReminderController($scope, blockUI, dialogs, $stateParams, $state, userService, dataService) {
        /* jshint validthis:true */
        var vm = this;
        vm.title = 'ReminderController';

        redirectToAppProtocolLink();

        activate();

        $scope.data = { Password: '', PasswordConfirm: '', Valid: false, Done: false };

        function activate() {
            $scope.Request = { RememberKey: $stateParams.key, ZipCode: '', NewPassword: '' };

            $scope.$watch('data.Password', function (data) {
                console.log('change');
                console.log(data);
                $scope.Request.NewPassword = data;
            });

            $scope.ChangePassword = function () {
                dataService.user.finishPasswordReminder($scope.Request).then(function (data) {
                    if (!data.Failed) {
                        dialogs.notify('Password Changed', 'Your password has been changed.');
                        $state.go('login');
                    } else {
                        dialogs.error('Password Change Error', data.Message);
                    }
                });
            };
        };

        function redirectToAppProtocolLink() {
            console.log('attempt to redirect to spot protocol link...');

            var isiOS = navigator.userAgent.match('iPad') || navigator.userAgent.match('iPhone') || navigator.userAgent.match('iPod');
            var isAndroid = navigator.userAgent.match('Android');

            if (isiOS || isAndroid) {
                var protocolLink = 'spot://mdc.mobile.app/changepassword?guid=' + $stateParams.key;
                document.getElementById('app-protocol-loader').src = protocolLink;
            }
        };
    };
})();