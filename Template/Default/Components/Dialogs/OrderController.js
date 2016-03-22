(function () {
    'use strict';

    angular
    .module('app')
    .controller('OrderController', OrderController);

    OrderController.$inject = ['$rootScope', '$scope', '$uibModalInstance', 'blockUI', 'data', 'dataService','configService'];

    function OrderController($rootScope, $scope, $uibModalInstance, blockUI, data, dataService, configService) {
        /* jshint validthis:true */
        var vm = this;
        vm.title = 'OrderController';

        activate();

        function activate() {
            $scope.InvoiceID = data.key;
            $scope.Orders = data.orders;
            $scope.currentPage = 1;

            for (var x = 0; x < data.orders.length; x++) {
                if (data.orders[x].InvoiceID == data.key) {
                    $scope.currentPage = x+1;
                    break;
                }
            }

            $scope.LoadOrder = function () {
                dataService.invoice.getInvoiceDetails($scope.InvoiceID).then(function (data) {
                    if (!data.Failed) {
                        $scope.SingleOrder = data.ReturnObject;
                    } else {
                        dialogs.error('Load failed.', data.Message);
                    }
                });
            };

            $scope.close = function () {
                $uibModalInstance.close();
            };

            $scope.numPages = function () {
                return Math.ceil($scope.Orders.length / $scope.numPerPage);
            };

            $scope.showPromisedDate = function (pDate) {
                return ((new Date(pDate)).getTime() > 0)
            };

            $scope.pageChanged = function () {
                $scope.InvoiceID = $scope.Orders[$scope.currentPage - 1].InvoiceID;
                $scope.LoadOrder();
            };

            $scope.print = function () {
                var printContents = document.getElementsByClassName('modal-body')[0].innerHTML;
                if (printContents != null) {
                    var popupWin = window.open('', '_blank', '');
                    popupWin.document.open()
                    popupWin.document.write('<html><head><link rel="stylesheet" type="text/css" media="print" href="' + configService.getCSSPath() + '" /></head><body onload="window.print(); window.close();">' + printContents + '</html>');
                    popupWin.document.close();
                }
            };

            $scope.LoadOrder();
        };
    }
})();