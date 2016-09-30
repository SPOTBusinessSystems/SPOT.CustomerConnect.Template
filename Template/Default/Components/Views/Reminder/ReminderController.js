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
    };
})();