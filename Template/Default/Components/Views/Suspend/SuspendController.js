(function () {
    'use strict';

    angular
    .module('app')
    .controller('SuspendController', SuspendController);

    SuspendController.$inject = ['$rootScope', '$scope', 'blockUI', 'dialogs', 'settingsService', 'dataService', 'userService'];

    function SuspendController($rootScope, $scope, blockUI, dialogs, settingsService, dataService, userService) {
        /* jshint validthis:true */
        var vm = this;
        vm.title = 'SuspendController';

        activate();

        function activate() {
            $scope.Customer = userService.getCustomer();
            $scope.Cancellation = { Comments: '' };

            // Date Control
            $scope.open = function ($event, start) {
                $scope.openedStart = false;
                $scope.openedEnd = false;

                $event.preventDefault();
                $event.stopPropagation();

                if (start) {
                    $scope.openedStart = true;
                } else {
                    $scope.openedEnd = true;
                }

            };

            $scope.dateOptions = {
                formatYear: 'yy',
                startingDay: 1
            };

            $scope.dateFormat = 'MM-dd-yyyy';
            $scope.minDate = Date.now();
            $scope.initDate = Date.now();
            $scope.maxDate = moment().add(6, 'months');

            $scope.scheduleCancellation = function () {
                dataService.route.saveCancellation($scope.Cancellation).then(function (data) {
                    if (!data.Failed) {
                        dialogs.notify('Success', 'Your suspension scheduled has been from ' + moment($scope.Cancellation.FromDate).format('MM-DD-YYYY') + ' to ' + moment($scope.Cancellation.ToDate).format('MM-DD-YYYY') + '.');
                        $scope.cancellationForm.$setPristine();
                        $scope.Cancellation = { FromDate: null, ToDate: null, Comments: '' };
                    } else {
                        dialogs.error('Error', 'Your suspension was not able to be scheduled. Please try again.');
                    }
                });
            };

            $scope.pendingSuspensions = function () {
                dataService.route.pendingCancellations().then(function (data) {
                    if (!data.Failed) {
                        var dlg = dialogs.create(settingsService.path + 'Components/Dialogs/Suspensions.html', 'SuspensionsController', data.ReturnObject);
                    } else {
                        dialogs.error('Error', 'Unable to display pending suspensions.');
                    }
                });
            };
        };
    };
})();