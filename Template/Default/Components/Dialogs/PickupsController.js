(function () {
    'use strict';

    angular
    .module('app')
    .controller('PickupsController', PickupsController);

    PickupsController.$inject = ['$scope', '$uibModalInstance', 'blockUI', 'data', 'dialogs', 'configService'];

    function PickupsController($scope, $uibModalInstance, blockUI, data, dialogs, configService) {
        /* jshint validthis:true */
        var vm = this;
        vm.title = 'PickupsController';

        activate();

        function activate() {
            $scope.Pickups = { PendingPickups: data };
            $scope.Settings = configService.getProfile();

            $scope.filteredPickups = [];
            $scope.itemsPerPage = 5;
            $scope.currentPage = 1;

            $scope.numPages = function () {
                return Math.ceil($scope.Pickups.PendingPickups.length / $scope.numPerPage);
            };

            $scope.figureOutPickupsToDisplay = function () {
                var begin = (($scope.currentPage - 1) * $scope.itemsPerPage);
                var end = begin + $scope.itemsPerPage;

                $scope.filteredPickups = [];

                if ($scope.Pickups.PendingPickups != null) {
                    if ($scope.Pickups.PendingPickups.length > 0) {
                        $scope.filteredPickups = $scope.Pickups.PendingPickups.slice(begin, end);
                    }
                }
            };

            $scope.pageChanged = function () {
                $scope.figureOutPickupsToDisplay();
            };

            $scope.done = function () {
                $uibModalInstance.close($scope.data);
            }; // end done

            $scope.figureOutPickupsToDisplay();
        }
    }
})();