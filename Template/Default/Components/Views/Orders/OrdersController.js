﻿(function () {
    'use strict';

    angular
    .module('app')
    .controller('OrdersController', OrdersController);

    OrdersController.$inject = ['$scope', 'dialogs', 'blockUI', '$filter', '$uibModal', 'settingsService'];

    function OrdersController($scope, dialogs, blockUI, $filter, $uibModal, settingsService) {
        /* jshint validthis:true */
        var vm = this;
        vm.title = 'OrdersController';

        activate();

        function activate() {
            // Init
            $scope.Orders = null;
            $scope.ReadyOrders = null;
            $scope.SingleOrder = null;
            $scope.Filters = { Status: '128', StartDate: moment().subtract(90, 'days').calendar(), EndDate: moment().format('L') };
            $scope.Customer = CustomerConnect.Config.Customer;

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

            // Load orders, at init and on status and date changes.
            $scope.LoadOrders = function () {
                if ($scope.Filters.StartDate == null || $scope.Filters.EndDate == null) {
                    return;
                }

                CustomerConnect.Invoice.GetInvoiceList($scope.Filters.Status, moment($scope.Filters.StartDate).startOf('day').format('MM/DD/YYYY HH:mm:ss'), moment($scope.Filters.EndDate).endOf('day').format('MM/DD/YYYY HH:mm:ss'))
                    .done(function (data) {
                        $scope.$apply(function () {
                            var orderBy = $filter('orderBy');
                            $scope.Orders = orderBy(data.ReturnObject, 'DropoffDateTime', true);
                            $scope.figureOutOrdersToDisplay();
                        });
                    }).fail(function (data) {
                        dialogs.error('Load failed.', data.Message);
                        $scope.filteredOrders = [];
                    });

                if ($scope.Filters.Status == '128') {
                    CustomerConnect.Invoice.GetInvoiceList('129', moment($scope.Filters.StartDate).startOf('day').format('MM/DD/YYYY HH:mm:ss'), moment($scope.Filters.EndDate).endOf('day').format('MM/DD/YYYY HH:mm:ss'))
                        .done(function (data) {
                            $scope.$apply(function () {
                                var orderBy = $filter('orderBy');
                                $scope.ReadyOrders = orderBy(data.ReturnObject, 'DropoffDateTime', true);
                                $scope.figureOutReadyOrdersToDisplay();
                            });
                        }).fail(function (data) {
                            dialogs.error('Load failed.', data.Message);
                            $scope.filteredReadyOrders = [];
                        });
                }
            };

            // Date Picker Functions:
            $scope.open = function ($event, start) {
                $event.preventDefault();
                $event.stopPropagation();

                if (start) {
                    $scope.openedStart = true;
                } else {
                    $scope.openedEnd = true;
                }
            };

            $scope.dateOptions = {
                formatYear: 'yyyy',
                startingDay: 1
            };

            $scope.dateFormat = 'MM/dd/yyyy';

            // Show Order
            $scope.ShowOrder = function (key, orders) {
                $scope.data = { key: key, orders: orders };

                var dlg = dialogs.create(settingsService.path + 'Components/Dialogs/Order.html', 'OrderController', $scope.data, { size: 'md' });
            };

            // Get first data.
            $scope.LoadOrders();
        };
    };
})();