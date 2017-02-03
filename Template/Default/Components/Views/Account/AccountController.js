var authProvider;

(function () {
    'use strict';

    angular
    .module('app')
    .controller('accountcontroller', accountcontroller);

    accountcontroller.$inject = ['$scope', 'dialogs', '$rootScope', '$filter', 'settingsService', '$state', 'dataService', 'userService', 'configService', '$compile', '$stateParams', '$ocLazyLoad'];

    function accountcontroller($scope, dialogs, $rootScope, $filter, settingsService, $state, dataService, userService, configService, $compile, $stateParams, $ocLazyLoad) {
        /* jshint validthis:true */
        var vm = this;
        vm.title = 'accountcontroller';

        activate();

        function activate() {
            $scope.Customer = angular.copy(userService.getCustomer());
            $scope.Settings = configService.getProfile();
            $scope.configService = configService;
            
            // Password change
            if ($stateParams.requirePasswordChange) {
                $scope.requirePasswordChange = $stateParams.requirePasswordChange;
            } else {
                $scope.requirePasswordChange = false;
            }

            //console.log($scope.Settings);

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
            };

            $scope.validEmail = function () {
                return CustomerConnect.Util.Validate.EmailAddress($scope.Customer.EmailAddress);
            }

            // Save Records
            $scope.SaveAccount = function () {
                var ci = $scope.Customer;

                if ($scope.birthMonth) {
                    ci.Birthdate = new Date(Date.UTC(2012, $scope.birthMonth - 1, $scope.birthDate));
                }

                if ($scope.Customer.CreditCards.length > 0) {
                    $scope.Customer.CreditCardSaveMode = 2;
                    var ccArray = $scope.Customer.CreditCards;

                    // Loop checking for changes.
                    for (var index = 0; index < ccArray.length; index++)
                    {
                        var ccIndex = ccArray[index];

                        if (ccIndex.CardId.startsWith('New_')) {
                            //console.log('new card')
                            // New credit card, move to new credit cards save.
                                
                            // Empty card added but removed
                            if (ccIndex.MarkDeleted) {
                                $scope.Customer.CreditCards.remove(ccIndex);
                                continue;
                            }

                            // validate card info
                            if (!CustomerConnect.Util.Validate.CCNumber(ccIndex.CardInfo)) {
                                swal({
                                    type: 'error',
                                    title: 'Unable to add new credit card',
                                    text: "A valid credit card number is required."
                                });
                                return;
                            }

                            if (!$scope.Customer.CreditCardsToSave)
                            {
                                $scope.Customer.CreditCardsToSave = [];
                            }

                            // Verify card isn't already listed.
                            var alreadyExists = false;

                            for (var subIndex = 0; subIndex < $scope.Customer.CreditCardsToSave; subIndex++) {
                                if ($scope.Customer.CreditCardsToSave[subIndex].CardInfo == ccIndex.CardInfo && $scope.Customer.CreditCardsToSave[subIndex].CardExpiration == ccIndex.CardExpiration) {
                                    alreadyExists = true;
                                    break;
                                }
                            }

                            if (!alreadyExists) {
                                $scope.Customer.CreditCardsToSave.push({ number: ccIndex.CardInfo, type: CustomerConnect.Util.Validate.GetCCType(ccIndex.CardInfo), expiration: ccIndex.CardExpiration, SetPrimary: ccIndex.SetPrimary, MarkDeleted: ccIndex.MarkDeleted });
                                $scope.Customer.CreditCards.remove(ccIndex);
                            }
                        } else {
                            //console.log('existing card');
                            if (ccIndex.CardInfo != userService.getCustomer().CreditCards[index].CardInfo || ccIndex.CardExpiration != moment(userService.getCustomer().CreditCards[index].CardExpiration).format("MM/YY")) {
                                if (!CustomerConnect.Util.Validate.CCNumber(ccIndex.CardInfo)) {
                                    //console.log('error');
                                    //console.log(ccIndex);
                                    swal({
                                        type: 'error',
                                        title: 'Credit Card Update',
                                        text: 'When updating your credit card, please re-enter your full credit card number and expiration.'
                                    });
                                    return;
                                } else {
                                    // Delete, re-add with new CC Info and expiration
                                    $scope.Customer.CreditCards[index].MarkDeleted = true;
                                    $scope.Customer.creditCardsToSave = [{ number: ccIndex.CardInfo, type: CustomerConnect.Util.Validate.GetCCType(ccIndex.CardInfo), expiration: ccIndex.CardExpiration, SetPrimary: ccIndex.SetPrimary, MarkDeleted: ccIndex.MarkDeleted }];
                                }
                            }
                        }
                    }

                    //console.log('save');
                    //console.log($scope.Customer.CreditCardsToSave);
                    //console.log($scope.Customer.CreditCards);

                    // temp
                    //return;
                }

                dataService.customer.saveCustomer(ci).then(function (data) {
                    if (!data.Failed) {
                        swal({
                            type: 'success',
                            title: 'Update submitted',
                            text: $scope.Settings['Account Update']['Submitted Message']
                        }).then(function () {
                            $scope.accountForm.$setPristine();

                            dataService.customer.getCustomer().then(function (data) {
                                if (!data.Failed) {
                                    userService.setCustomer(data.ReturnObject);
                                }

                                $state.reload();
                            });
                        });
                    } else {
                        swal({
                            type: 'error',
                            title: 'Update Failed',
                            text: data.Message
                        });

                        return;
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

            $scope.customerReferral = function () {
                for (var x = 0; x < $scope.Settings.Stores.length; x++) {
                    if ($scope.Settings.Stores[x].StoreID == $scope.Customer.AccountNodeID) {
                        $scope.Store = $scope.Settings.Stores[x];
                    }
                }

                var p = $ocLazyLoad.load(settingsService.path + 'Components/Dialogs/DialogController.js');
                p.then(function () {
                    var dlg = dialogs.create(settingsService.path + 'Components/Dialogs/CustomerReferral.html', 'DialogController', { Customer: $scope.Customer, Settings: $scope.Settings, Store: $scope.Store }, { size: 'sm' });
                });
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

            // Initialize Customer
            $scope.initCustomer();
        };
    }
})();