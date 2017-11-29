(function () {
    'use strict';

    angular
    .module('app')
    .controller('OrdersController', OrdersController);

    OrdersController.$inject = ['$scope', 'dialogs', 'blockUI', '$filter', '$uibModal', 'settingsService', 'dataService', 'userService', 'configService', '$ocLazyLoad'];

    function OrdersController($scope, dialogs, blockUI, $filter, $uibModal, settingsService, dataService, userService, configService, $ocLazyLoad) {
        /* jshint validthis:true */
        var vm = this;
        vm.title = 'OrdersController';

        activate();

        function activate() {
            // Init
            $scope.Orders = null;
            $scope.ReadyOrders = null;
            $scope.SingleOrder = null;
            $scope.Filters = { Status: '128', StartDate: moment().subtract(90, 'days').format(), EndDate: moment().format() };
            $scope.dateText = "Hide Dates";
            $scope.isCollapsed = false;
            $scope.Customer = userService.getCustomer();
            $scope.Settings = configService.getProfile();

            $scope.filteredOrders = [];
            $scope.itemsPerPage = 10;
            $scope.currentPage = 1;

            $scope.filteredReadyOrders = [];
            $scope.readyCurrentPage = 1;

            $scope.numPages = function () {
                return Math.ceil($scope.Orders.length / $scope.numPerPage);
            };

            $scope.readyNumPages = function () {
                return Math.ceil($scope.ReadyOrders.length / $scope.numPerPage);
            };

            $scope.figureOutOrdersToDisplay = function () {
                var begin = (($scope.currentPage - 1) * $scope.itemsPerPage);
                var end = begin + $scope.itemsPerPage;
                $scope.filteredOrders = [];
                if ($scope.Orders) {
                    $scope.filteredOrders = $scope.Orders.slice(begin, end);
                }
            };

            $scope.figureOutReadyOrdersToDisplay = function () {
                var begin = (($scope.readyCurrentPage - 1) * $scope.itemsPerPage);
                var end = begin + $scope.itemsPerPage;
                $scope.filteredReadyOrders = [];
                if ($scope.ReadyOrders) {
                    $scope.filteredReadyOrders = $scope.ReadyOrders.slice(begin, end);
                }
            };

            $scope.pageChanged = function () {
                $scope.figureOutOrdersToDisplay();
            };

            $scope.readyPageChanged = function () {
                $scope.figureOutReadyOrdersToDisplay();
            };

            $scope.hideShowDates = function () {
                $scope.isCollapsed = !$scope.isCollapsed;
                $scope.updateDateText();
            };

            $scope.updateDateText = function () {
                if ($scope.isCollapsed) {
                    $scope.dateText = "Select Dates";
                } else {
                    $scope.dateText = "Hide Dates";
                }
            };

            // Load orders, at init and on status and date changes.
            $scope.LoadOrders = function () {
                if ($scope.Filters.StartDate == null || $scope.Filters.EndDate == null) {
                    return;
                }

                dataService.invoice.getInvoiceList($scope.Filters.Status, moment($scope.Filters.StartDate).startOf('day').format('MM/DD/YYYY HH:mm:ss'), moment($scope.Filters.EndDate).endOf('day').format('MM/DD/YYYY HH:mm:ss'))
                    .then(function (data) {
                        if (!data.Failed) {
                            var orderBy = $filter('orderBy');
                            $scope.Orders = orderBy(data.ReturnObject, 'DropoffDateTime', true);
                            $scope.figureOutOrdersToDisplay();
                        } else {
                            dialogs.error('Load failed.', data.Message);
                            $scope.filteredOrders = [];
                        }
                    });

                if ($scope.Filters.Status == '128') {
                    dataService.invoice.getInvoiceList('129', moment($scope.Filters.StartDate).startOf('day').format('MM/DD/YYYY HH:mm:ss'), moment($scope.Filters.EndDate).endOf('day').format('MM/DD/YYYY HH:mm:ss'))
                        .then(function (data) {
                            if (!data.Failed) {
                                var orderBy = $filter('orderBy');
                                $scope.ReadyOrders = orderBy(data.ReturnObject, 'DropoffDateTime', true);
                                $scope.figureOutReadyOrdersToDisplay();
                            } else {
                                dialogs.error('Load failed.', data.Message);
                                $scope.filteredReadyOrders = [];
                            }
                        });
                }
            };

            $scope.dateOptions = {
                formatYear: 'yy',
                startingDay: 1
            };

            $scope.dateFormat = $scope.Settings.General["Data Formats"]["Date Format"].toLowerCase().split("m").join("M");

            // Show Order
            $scope.ShowOrder = function (key, orders) {
                $scope.data = { key: key, orders: orders };

                var p = $ocLazyLoad.load(settingsService.path + 'Components/Dialogs/OrderController.js');
                p.then(function () {
                    var dlg = dialogs.create(settingsService.path + 'Components/Dialogs/Order.html', 'OrderController', $scope.data, { size: 'md' });
                });
            };

            $scope.hasOrdersStatusLabel = function () {
                switch ($scope.Filters.Status) {
                    case '128':
                    case '129':
                    case '130': return true;
                }

                return false;
            };

            $scope.getOrdersStatusLabel = function () {

                if($scope.Orders)
                {
                    var x = $scope.Orders[0];

                    if (x && x.StatusDisplayLabel)
                        return x.StatusDisplayLabel;
                }

                switch($scope.Filters.Status)
                {
                    case '128': return "Dropoff Date";
                    case '129': return "Ready Date";
                    case '130': return "Sold Date";
                }

                return "";
            };

            $scope.getReadyOrdersStatusLabel = function () {
                if ($scope.ReadyOrders) {
                    var x = $scope.Orders[0];

                    if (x && x.StatusDisplayLabel)
                        return x.StatusDisplayLabel;
                }

                return "Ready Date";
            };

            // Get first data.
            $scope.LoadOrders();
        };
    };
})();