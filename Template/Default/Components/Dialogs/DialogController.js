(function () {
    'use strict';

    angular
    .module('app')
    .controller('DialogController', DialogController);

    DialogController.$inject = ['$scope', '$uibModalInstance', 'data', 'configService', 'dialogs', 'settingsService', 'userService', 'dataService'];

    function DialogController($scope, $uibModalInstance, data, configService, dialogs, settingsService, userService, dataService) {
        /* jshint validthis:true */
        var vm = this;
        vm.title = 'DialogController';

        activate();

        function activate() {
            $scope.data = data;
            $scope.opened = false;
            $scope.Customer = angular.copy(userService.getCustomer());

            $scope.open = function ($event) {
                $event.preventDefault();
                $event.stopPropagation();
                $scope.opened = true;
            }; // end open

            $scope.done = function () {
                $uibModalInstance.close($scope.data);
            }; // end done

            $scope.cancel = function () {
                $uibModalInstance.close();
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

            $scope.email = function () {

            };

            $scope.inviteFriend = function () {
                var dlg = dialogs.create(settingsService.path + 'Components/Dialogs/InviteFriend.html', 'DialogController', { ReferralCode: $scope.Customer.ReferralCode }, { size: 'sm' });
                dlg.result.then(function (data) {
                    if (typeof (data) == 'undefined')
                        return;

                    var body = 
                    {
                        ReferralCode: $scope.Customer.ReferralCode,
                        EmailAddress: data.emailAddress,
                        FirstName: data.firstName,
                        LastName: data.lastName,
                        SendEmail: true
                    };


                    dataService.customer.inviteFriend(body).then(function (data2) {
                        if (!data2.Failed) {
                            dialogs.notify(data.firstName + ' has been Notified!',
                                data.firstName +
                                " has been sent a $10 coupon, and you will receive a $10 coupon when " +
                                data.firstName +
                                " uses us for the first time");
                        } else {
                            dialogs.error('Error', 'Unable to send notification.');
                        }
                    });

                });
            };
        }
    }
})();