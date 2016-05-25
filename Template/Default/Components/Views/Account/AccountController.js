var authProvider;

(function () {
    'use strict';

    angular
    .module('app')
    .controller('accountcontroller', accountcontroller);

    accountcontroller.$inject = ['$scope','dialogs','$rootScope','$filter','settingsService','$state','dataService','userService','configService'];

    function accountcontroller($scope, dialogs, $rootScope, $filter, settingsService, $state, dataService, userService, configService) {
        /* jshint validthis:true */
        var vm = this;
        vm.title = 'accountcontroller';

        activate();

        function activate() {
            $scope.Customer = angular.copy(userService.getCustomer());
            $scope.Settings = configService.getProfile();
            $scope.configService = configService;

            console.log($scope.Settings);

            $scope.Customer.Notifications = $filter('orderBy')($scope.Customer.Notifications, 'NotificationTypeDescription', false);
            $scope.Settings.Notifications = $filter('orderBy')($scope.Settings.Notifications, ['Description', 'MethodName'], false);

            $scope.$watch('birthMonth', function () {
                $scope.setBirthDays();
            });

            $scope.setBirthDays = function () {
                $scope.birthDays = [];

                for (var x = 1; x <= getNumberOfDays(2012, $scope.birthMonth - 1) ; x++) {
                    $scope.birthDays.push(x);
                }
            };

            function getNumberOfDays(year, month) {
                var isLeap = ((year % 4) == 0 && ((year % 100) != 0 || (year % 400) == 0));
                return [31, (isLeap ? 29 : 28), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month];
            };

            // Set data manip
            $scope.initCustomer = function () {
                if ($scope.Customer.Birthdate == '0001-01-01T00:00:00') {
                    $scope.Customer.Birthdate = '';
                } else {
                    $scope.birthMonth = moment($scope.Customer.Birthdate).month() + 1;
                    $scope.setBirthDays();
                    $scope.birthDate = moment($scope.Customer.Birthdate).date();
                }

                console.log($scope.Customer);
            };

            $scope.validEmail = function () {
                return CustomerConnect.Util.Validate.EmailAddress($scope.Customer.EmailAddress);
            }

            // Initialize Customer
            $scope.initCustomer();

            // Save Records
            $scope.SaveAccount = function () {
                var ci = $scope.Customer;

                if ($scope.birthMonth) {
                    ci.Birthdate = new Date(2012, $scope.birthMonth - 1, $scope.birthDate);
                }

                if ($scope.Customer.CreditCards.length > 0) {
                    if (userService.getCustomer().CreditCards.length > 0)
                    {
                        if ($scope.Customer.CreditCards[0].CardInfo != userService.getCustomer().CreditCards[0].CardInfo || $scope.Customer.CreditCards[0].CardExpiration != userService.getCustomer().CreditCards[0].CardExpiration) {
                            if (!CustomerConnect.Util.Validate.CCNumber($scope.Customer.CreditCards[0].CardInfo)) {
                                dialogs.error('Credit Card Update', "When updating your credit card, please re-enter your full credit card number and expiration.");
                                return;
                            } else {
                                $scope.Customer.creditCardsToSave = [{ number: $scope.Customer.CreditCards[0].CardInfo, type: CustomerConnect.Util.Validate.GetCCType($scope.Customer.CreditCards[0].CardInfo), expiration: $scope.Customer.CreditCards[0].CardExpiration }];
                            }
                        }
                    } else
                    {
                        $scope.Customer.creditCardsToSave = [{ number: $scope.Customer.CreditCards[0].CardInfo, type: CustomerConnect.Util.Validate.GetCCType($scope.Customer.CreditCards[0].CardInfo), expiration: $scope.Customer.CreditCards[0].CardExpiration }];
                    }
                }

                dataService.customer.saveCustomer(ci).then(function (data) {
                    if (!data.Failed) {
                        var dlg = dialogs.notify('Update submitted', $scope.Settings['Account Update']['Submitted Message']);
                        dlg.result.then(function () {
                            $scope.accountForm.$setPristine();

                            dataService.customer.getCustomer().then(function (data) {
                                if (!data.Failed) {
                                    userService.setCustomer(data.ReturnObject);
                                }

                                $state.reload();
                            });
                        })
                    } else {
                        dialogs.error('Update failed.', data.Message);
                    }
                });
            };

            // Undo Form
            $scope.UndoChanges = function () {
                $state.reload();
            };

            // Date Control
            $scope.open = function ($event) {
                $event.preventDefault();
                $event.stopPropagation();

                $scope.opened = true;
            };

            $scope.dateOptions = {
                formatYear: 'yy',
                startingDay: 1
            };

            $scope.dateFormat = 'MM-dd-yyyy';

            // Additional Phones
            $scope.AddPhone = function () {
                if ($scope.Customer.Phones.length < 5) {
                    $scope.Customer.Phones.push({ Extension: "", Number: "", PhoneMask: $scope.Settings.General['Data Formats']['Phone Mask'], PhoneType: "Home" });
                }
            };

            $scope.RemovePhone = function ($index) {
                $scope.Customer.Phones.splice($index, 1);
            };

            $scope.changePassword = function () {
                var dlg = dialogs.create(settingsService.path + 'Components/Dialogs/ChangePassword.html', 'DialogController', $scope.data, { size: 'sm' });
                dlg.result.then(function (data) {
                    if (typeof (data) !== 'undefined') {
                        dataService.user.changePassword(data.Password).then(function (data) {
                            if (!data.Failed) {
                                dialogs.notify('Password Changed', 'Your password has been changed.');
                            } else {
                                var dlge = dialogs.notify('Error', data.Message);
                                dlge.result.then(function () {
                                    $scope.changePassword();
                                });
                            }
                        });
                    }
                });
            };

            $scope.customerReferral = function () {
                for (var x = 0; x < $scope.Settings.Stores.length; x++) {
                    if ($scope.Settings.Stores[x].StoreID == $scope.Customer.AccountNodeID) {
                        $scope.Store = $scope.Settings.Stores[x];
                    }
                }

                var dlg = dialogs.create(settingsService.path + 'Components/Dialogs/CustomerReferral.html', 'DialogController', { Customer: $scope.Customer, Settings: $scope.Settings, Store: $scope.Store }, { size: 'sm' });
            };

            $scope.convertToRoute = function () {
                dataService.customer.convertToDelivery().then(function (data) {
                    if (!data.Failed) {
                        dialogs.notify('Delivery Signup', 'You have been converted to a delivery account.')

                        dataService.customer.getCustomer().then(function (cdata) {
                            if (!data.Failed) {
                                userService.setCustomer(cdata.ReturnObject);
                                $state.reload();
                            } else {
                                dialogs.error('Retrieval failed.', data.Message);
                            }
                        });
                    } else {
                        dialogs.error('Update failed.', data.Message);
                    }
                });
            };
        };
    }
})();