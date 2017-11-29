(function () {
    'use strict';

    angular
    .module('app')
    .controller('GiftCardsController', GiftCardsController);

    GiftCardsController.$inject = ['$scope', 'dialogs', 'blockUI', 'settingsService', 'userService', 'dataService', '$ocLazyLoad'];

    function GiftCardsController($scope, dialogs, blockUI, settingsService, userService, dataService, $ocLazyLoad) {
        /* jshint validthis:true */
        var vm = this;
        vm.title = 'GiftCardsController';

        activate();

        function activate() {
            $scope.GiftCards = null;
            $scope.Customer = userService.getCustomer();

            $scope.LoadCards = function () {
                dataService.customer.getGiftCards().then(function (data) {
                    if (!data.Failed) {
                        $scope.GiftCards = data.ReturnObject;
                    }
                });
            };

            $scope.AddCard = function () {
                var p = $ocLazyLoad.load(settingsService.path + 'Components/Dialogs/DialogController.js');
                p.then(function () {
                    var dlg = dialogs.create(settingsService.path + 'Components/Dialogs/AddGiftCard.html', 'DialogController', $scope.data, { size: 'sm' });
                    dlg.result.then(function (dlgData) {
                        if (typeof (dlgData) != 'undefined' && dlgData.Number) {
                            dataService.customer.redeemGiftCard(dlgData.Number).then(function (data) {
                                if (!data.Failed) {
                                    dialogs.notify('Gift Card Reedemed', 'The gift card has been applied to your account.');
                                    $scope.LoadCards();
                                } else {
                                    if (data.Message)
                                        dialogs.error('Error', data.Message);
                                    else
                                        dialogs.error('Error', 'Unable to add gift card to account.');
                                }
                            });
                        }
                    });
                });
            };

            $scope.LoadCards();
        }
    };
})();