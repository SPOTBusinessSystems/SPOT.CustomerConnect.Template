(function () {
    'use strict';

    angular
    .module('app')
    .controller('StatementController', StatementController);

    StatementController.$inject = ['$rootScope','$scope','$modalInstance','blockUI','data','dialogs','settingsService','dataService'];

    function StatementController($rootScope, $scope, $modalInstance, blockUI, data, dialogs, settingsService, dataService) {
        /* jshint validthis:true */
        var vm = this;
        vm.title = 'StatementController';

        activate();

        function activate() {
            $scope.StatementID = data;
            $scope.Orders = [];

            $scope.filteredItems = [];
            $scope.itemsPerPage = 10;
            $scope.currentPage = 1;

            $scope.numPages = function () {
                return Math.ceil($scope.Statement.StatementItems.length / $scope.numPerPage);
            };

            $scope.figureOutItemsToDisplay = function () {
                var begin = (($scope.currentPage - 1) * $scope.itemsPerPage);
                var end = begin + $scope.itemsPerPage;
                $scope.filteredItems = [];
                $scope.filteredItems = $scope.Statement.StatementItems.slice(begin, end);
            };

            $scope.pageChanged = function () {
                $scope.figureOutItemsToDisplay();
            };

            $scope.findOrders = function () {
                for (var x = 0; x < $scope.Statement.StatementItems.length; x++) {
                    if ($scope.Statement.StatementItems[x].InvoiceID != '00000000-0000-0000-0000-000000000000') {
                        $scope.Orders.push($scope.Statement.StatementItems[x]);
                    }
                }
            };

            $scope.LoadStatement = function () {
                dataService.ar.getStatement($scope.StatementID).then(function (data) {
                    if (!data.Failed) {
                        $scope.Statement = data.ReturnObject;
                        $scope.figureOutItemsToDisplay();
                        $scope.findOrders();
                    } else {
                        dialogs.error('Load failed.', data.Message);
                    }

                });
            };

            // Show Order
            $scope.ShowOrder = function (key, orders) {
                $scope.data = { key: key, orders: orders };
                var dlg = dialogs.create(settingsService.path + 'Components/Dialogs/Order.html', 'OrderController', $scope.data, 'sm');
            };

            $scope.close = function () {
                $modalInstance.close();
            };

            $scope.LoadStatement();
        }
    }
})();