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
            $scope.QuickOrders = null;

            $scope.SingleOrder = null;
            $scope.Filters = { Status: '128', StartDate: moment().subtract(90, 'days').format(), EndDate: moment().format() };
            $scope.dateText = "Hide Dates";
            $scope.isCollapsed = false;
            $scope.Customer = userService.getCustomer();
            $scope.Settings = configService.getProfile();

            $scope.itemsPerPage = 10;

            $scope.filteredOrders = [];
            $scope.currentPage = 1;

            $scope.filteredReadyOrders = [];
            $scope.readyCurrentPage = 1;

            $scope.filteredQuickOrders = [];
            $scope.quickCurrentPage = 1;

            $scope.numPages = function () {
                return Math.ceil($scope.Orders.length / $scope.numPerPage);
            };
            $scope.readyNumPages = function () {
                return Math.ceil($scope.ReadyOrders.length / $scope.numPerPage);
            };
            $scope.quickNumPages = function () {
                return Math.ceil($scope.QuickOrders.length / $scope.numPerPage);
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
            $scope.figureOutQuickOrdersToDisplay = function () {
                var begin = (($scope.quickCurrentPage - 1) * $scope.itemsPerPage);
                var end = begin + $scope.itemsPerPage;
                $scope.filteredQuickOrders = [];
                if ($scope.QuickOrders) {
                    $scope.filteredQuickOrders = $scope.QuickOrders.slice(begin, end);
                }
            };

            $scope.pageChanged = function () {
                $scope.figureOutOrdersToDisplay();
            };
            $scope.readyPageChanged = function () {
                $scope.figureOutReadyOrdersToDisplay();
            };
            $scope.quickPageChanged = function () {
                $scope.figureOutQuickOrdersToDisplay();
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

                if ($scope.Filters.Status == '128') {
                    dataService.invoice.getInvoiceList('128', moment($scope.Filters.StartDate).startOf('day').format('MM/DD/YYYY HH:mm:ss'), moment($scope.Filters.EndDate).endOf('day').format('MM/DD/YYYY HH:mm:ss'))
                        .then(function (data) {
                            if (!data.Failed) {
                                var orderBy = $filter('orderBy');

                                //We need to sort orders by status
                                var x127 = [];
                                var x128 = [];

                                if (data.ReturnObject)
                                    for (var i = 0; i < data.ReturnObject.length; i++) {
                                        var x = data.ReturnObject[i];

                                        if (x.CurrentStatusID == 127)
                                            x127.push(x);
                                        else
                                            x128.push(x);
                                    }

                                $scope.QuickOrders = orderBy(x127, 'DropoffDateTime', true);
                                $scope.figureOutQuickOrdersToDisplay();

                                $scope.Orders = orderBy(x128, 'DropoffDateTime', true);
                                $scope.figureOutOrdersToDisplay();
                            } else {
                                dialogs.error('Load failed.', data.Message);
                                $scope.filteredQuickOrders = [];
                            }
                        });

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
                else {
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
                    case '127':
                    case '128':
                    case '129':
                    case '130': return true;
                }
                return false;
            };

            $scope.getOrdersStatusLabel = function () {
                switch ($scope.Filters.Status) {
                    case '128': return getStatusText($scope.Filters.Status, "In Process Date");
                    case '130':
                        if (isCounter())
                            return getStatusText($scope.Filters.Status, "Picked Up Date");
                        else
                            return getStatusText($scope.Filters.Status, "Delivered Date");
                }
                return getStatusText($scope.Filters.Status, "");
            };
            $scope.getReadyOrdersStatusLabel = function () {
                return getStatusText('129', "Ready Date");
            };
            $scope.getQuickOrdersStatusLabel = function () {
                return getStatusText('127', "Dropped Off Date");
            };
            $scope.getSoldDropdownLabel = function () {

                var a = null;

                if (isCounter()) {
                    a = $scope.Settings.Invoice.Counter;
                }
                else {
                    a = $scope.Settings.Invoice.Delivery;
                }
                if (a["Sold Status Label"]) {
                    return a["Sold Status Label"];
                }
                else {
                    return 'Sold';
                }
            };
            $scope.getInProcessDropdownLabel = function () {

                var a = null;

                if (isCounter()) {
                    a = $scope.Settings.Invoice.Counter;
                }
                else {
                    a = $scope.Settings.Invoice.Delivery;
                }
                if (a["Detailed Status Label"]) {
                    return a["Detailed Status Label"];
                }
                else {
                    return 'In Process';
                }
            };

            function isCounter() {

                var isNotRoute = $scope.Customer.RouteID == null || $scope.Customer.RouteID == '' || $scope.Customer.RouteID == '00000000-0000-0000-0000-000000000000';
                var isNotHotel = $scope.Customer.HotelID == null || $scope.Customer.HotelID == '' || $scope.Customer.HotelID == '00000000-0000-0000-0000-000000000000';

                return isNotRoute && isNotHotel;
            }

            function getStatusText(statusID, defaultText) {

                var a = null;

                if (!$scope.Settings.Invoice) {

                    switch (statusID) {
                        case '127': return "Dropped Off" + " Date";
                        case '128': return "In Process" + " Date";
                        case '129': return "Ready" + " Date";
                        case '130': return "Sold" + " Date";
                    }

                    return defaultText;
                }

                if (isCounter()) {
                    a = $scope.Settings.Invoice.Counter;
                }
                else {
                    a = $scope.Settings.Invoice.Delivery;
                }

                if (a)
                    switch (statusID) {
                        case '127': if (a["Quick Status Label"]) return a["Quick Status Label"] + " Date";
                        case '128': if (a["Detailed Status Label"]) return a["Detailed Status Label"] + " Date";
                        case '129': if (a["Ready Status Label"]) return a["Ready Status Label"] + " Date";
                        case '130': if (a["Sold Status Label"]) return a["Sold Status Label"] + " Date";
                    }

                return defaultText;
            }

            // Get first data.
            $scope.LoadOrders();
        };
    };
})();