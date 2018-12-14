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
            $scope.Settings = configService.getProfile();

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
                            dialogs.notify(data.firstName + ' has been notified!',
                                "Thank you! " +
                                data.firstName +
                                " has been sent a referral.");
                        } else {
                            dialogs.error('Error', 'Unable to send notification.');
                        }
                    });

                });
            };


            var defaultMessage =
                ["Share MyDryCleaner with your friends and you both receive $10.00",
                 "Simply share your personal referral code and receive credit when your friend uses us for the first time"];

            var s = $scope.Settings["General"];
            if (s && s.Refer && s.Refer.Message) {
                var a = s.Refer.Message
                if (typeof a === 'string') {
                    $scope.Message = [a];
                }
                else {
                    if (a.length && (a.length != 1 || a[0])) {
                        var messageLines = [];
                        for (var i = 0; i < a.length; i++)
                            messageLines[i] = Object.keys(a[i])[0];
                        $scope.Message = messageLines;
                    }
                }
            }
            if (!$scope.Message)
                $scope.Message = defaultMessage;
        }
    }
})();