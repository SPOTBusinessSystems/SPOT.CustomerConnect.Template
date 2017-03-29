(function () {
    'use strict';

    angular
    .module('app')
    .controller('PaymentsController', PaymentsController);

    PaymentsController.$inject = ['$scope', 'dialogs', 'dataService', 'userService', '$state'];
    function PaymentsController($scope, dialogs, dataService, userService, $state) {
        /* jshint validthis:true */
        var vm = this;
        vm.title = 'PaymentsController';

        activate();

        function activate() {
            $scope.Customer = userService.getCustomer();

            $scope.filteredPayments = [];
            $scope.itemsPerPage = 5;
            $scope.currentPage = 1;

            $scope.numPages = function () {
                return Math.ceil($scope.AR.Payments.length / $scope.numPerPage);
            };

            $scope.figureOutPaymentsToDisplay = function () {
                var begin = (($scope.currentPage - 1) * $scope.itemsPerPage);
                var end = begin + $scope.itemsPerPage;
                $scope.filteredPayments = [];
                if ($scope.AR.Payments) {
                    $scope.filteredPayments = $scope.AR.Payments.slice(begin, end);
                }
            };

            $scope.pageChanged = function () {
                $scope.figureOutPaymentsToDisplay();
            };

            $scope.init = function () {
                $scope.AR = { Balance: "0.00", Payments: [] };
                $scope.AR.Payment = { Amount: '0.00', CardInformation: null };

                dataService.ar.getPayments().then(function (data) {
                    if (!data.Failed) {
                        $scope.AR.Payments = data.ReturnObject;
                        $scope.figureOutPaymentsToDisplay();
                    } else {
                        dialogs.error('Load Failed', 'Unable to load payments.');
                    }
                });

                dataService.ar.getARBalance().then(function (data) {
                    if (!data.Failed) {
                        $scope.AR.Balance = data.ReturnObject.ARBalance;
                    } else {
                        $scope.AR.Balance = 'Error';
                        dialogs.error('Load Failed', 'Unable to retrieve balance.');
                    }
                });
            };

            $scope.init();


            $scope.CCValid = false;

            $scope.ValidateCard = function () {
                $scope.CCValid = CustomerConnect.Util.Validate.CCNumber($scope.AR.Payment.CardInformation.CardInfo);
            };

            $scope.submitPayment = function (saveCard) {
                var cc = $scope.AR.Payment.CardInformation;

                if (Number($scope.AR.Payment.Amount) <= 0) {
                    dialogs.error('Payment invalid', 'Payment amount cannot be less than 0.01.');
                    return;
                }

                if (cc.CardInfo == null && cc.CardId == null) {
                    dialogs.error('Payment invalid', 'Card number not provided.');
                    return;
                }

                if (cc.CardInfo == null && cc.CardExpiration == null) {
                    dialogs.error('Payment invalid', 'Card expiration not provided.');
                    return;
                }

                dataService.ar.savePayment(cc.CardId, cc.CardInfo, cc.CardExpiration, saveCard, $scope.AR.Payment.Amount + '').then(function (data) {
                    if (!data.Failed) {
                        var dlg = dialogs.notify('Payment submitted', 'Your payment has been submitted and will reflect on your account in up to 24 business hours.');
                        dlg.result.then(function () {
                            $state.reload();
                        });
                    } else {
                        dialogs.error('Payment failed.', data.Message);
                    }
                });
            };
        };
    };
})();