(function () {
    'use strict';

    angular
    .module('app')
    .controller('SuspensionsController', SuspensionsController);

    SuspensionsController.$inject = ['$scope', '$uibModalInstance', 'blockUI', 'data', 'dialogs'];

    function SuspensionsController($scope, $uibModalInstance, blockUI, data, dialogs) {
        /* jshint validthis:true */
        var vm = this;
        vm.title = 'SuspensionsController';

        activate();

        function activate() {
            $scope.Cancellations = { PendingCancellations: data };

            $scope.filteredCancellations = [];
            $scope.itemsPerPage = 5;
            $scope.currentPage = 1;

            $scope.numPages = function () {
                return Math.ceil($scope.Cancellations.PendingCancellations.length / $scope.itemsPerPage);
            };

            $scope.figureOutCancellationsToDisplay = function () {
                var begin = (($scope.currentPage - 1) * $scope.itemsPerPage);
                var end = begin + $scope.itemsPerPage;
                $scope.filteredCancellations = [];

                if ($scope.Cancellations.PendingCancellations != null) {
                    if ($scope.Cancellations.PendingCancellations.length > 0) {
                        $scope.filteredCancellations = $scope.Cancellations.PendingCancellations.slice(begin, end);
                    }
                }
            };

            $scope.pageChanged = function () {
                $scope.figureOutCancellationsToDisplay();
            };

            $scope.done = function () {
                $uibModalInstance.close($scope.data);
            }; // end done

            $scope.figureOutCancellationsToDisplay();
        }
    }
})();