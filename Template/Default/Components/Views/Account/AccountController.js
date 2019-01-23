var authProvider;

(function () {
    'use strict';

    angular
    .module('app')
    .controller('accountcontroller', accountcontroller);

    accountcontroller.$inject = ['$scope', 'dialogs', '$rootScope', '$filter', 'settingsService', '$state', 'dataService', 'userService', 'configService', '$compile', '$stateParams', '$ocLazyLoad', 'CheckStateChangeService', 'printService'];

    function accountcontroller($scope, dialogs, $rootScope, $filter, settingsService, $state, dataService, userService, configService, $compile, $stateParams, $ocLazyLoad, CheckStateChangeService, printService) {
        /* jshint validthis:true */
        var vm = this;
        vm.title = 'accountcontroller';

        activate();

        function activate() {
            $scope.notifyOptions = { onNotificationMethodChanged: function () { $scope.NotificationMethodChanged(); } };
            $scope.Customer = angular.copy(userService.getCustomer());
            $scope.Settings = configService.getProfile();
            $scope.configService = configService;
            $scope.disableSave = false;
            $scope.Validation = { PrimaryAddress: true, DeliveryAddress: true, BillingAdress: true };

            // Password change
            if ($stateParams.requirePasswordChange) {
                $scope.requirePasswordChange = $stateParams.requirePasswordChange;
                $stateParams.requirePasswordChange = false;
            } else {
                $scope.requirePasswordChange = false;
            }

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

            $scope.primaryAddressValid = function () {

                var res = $scope.Validation.PrimaryAddress && $scope.Validation.DeliveryAddress && $scope.Validation.BillingAddress;

                if ($scope.Customer.RouteName)// Primary address required if delivery enabled only
                    res = res && $scope.isFullAddress($scope.Customer.PrimaryAddress);

                return res;
            };

            $scope.primaryAddressValidInternal = function () {
                var a = $scope.Customer.PrimaryAddress;
                return $scope.addressValidInternal(a);
            };

            $scope.addressValidInternal = function (a) {
                if (!a)
                    return false;
                return $scope.isFullAddress(a);
            };

            $scope.isFirstLastName = function () {
                return !$scope.isName();
            }

            $scope.isName = function () {
                return $scope.Customer.CustomerType == "Business" || $scope.Customer.CustomerType == "Hotel";
            }

            // Save Records
            $scope.SaveAccount = function () {
                var ci = angular.copy($scope.Customer);

                ci.NotificationSaveMode = 2;

                if ($scope.birthMonth)
                    ci.Birthdate = new Date(Date.UTC(2012, $scope.birthMonth - 1, $scope.birthDate));

                var ccArray = ci.CreditCards;
                var ccChanged = false;

                if (ccArray.length > 0) {

                    ci.CreditCardSaveMode = 2;

                    if (!ci.CreditCardsToSave)
                        ci.CreditCardsToSave = [];
                    var ccSave = ci.CreditCardsToSave;

                    var GetCard = function (cc) {
                        return { number: cc.CardInfo, type: CustomerConnect.Util.Validate.GetCCType(cc.CardInfo), expiration: cc.CardExpiration, SetPrimary: cc.SetPrimary, MarkDeleted: cc.MarkDeleted };
                    };

                    // Loop checking for changes.
                    //for (var index = 0; index < ccArray.length; index++) {
                    for (var index = ccArray.length - 1; index >= 0; index--) {
                        var cc = ccArray[index];

                        if (cc.CardId.startsWith('New_')) {
                            // New credit card, move to new credit cards save.

                            ccChanged = true;

                            // Empty card added but removed
                            if (cc.MarkDeleted) {
                                ccArray.remove(cc);
                                continue;
                            }

                            // validate card info
                            if (!CustomerConnect.Util.Validate.CCNumber(cc.CardInfo)) {
                                swal({
                                    type: 'error',
                                    title: 'Unable to add new credit card',
                                    text: " A valid credit card number is required."
                                });

                                return;
                            }
                            if (!CustomerConnect.Util.Validate.CCType(cc.CardInfo, $scope.Settings['CreditCardSettings'])) {
                                swal({
                                    type: 'error',
                                    title: 'Unable to add new credit card',
                                    text: "Your credit card type is not supported."
                                });

                                return;
                            }

                            // Verify card isn't already listed.
                            var alreadyExists = false;

                            for (var subIndex = 0; subIndex < ccSave.length; subIndex++) {
                                if (ccSave[subIndex].CardInfo == cc.CardInfo && ccSave[subIndex].CardExpiration == cc.CardExpiration) {
                                    alreadyExists = true;
                                    break;
                                }
                            }

                            if (!alreadyExists) {
                                ccSave.push(GetCard(cc));
                                ccArray.remove(cc);
                            }

                        } else {
                            //console.log('existing card');
                            var cL = userService.getCustomer().CreditCards;
                            //index >= cL.length ||
                            if (cc.CardInfo != cL[index].CardInfo || cc.CardExpiration != moment(cL[index].CardExpiration).format("MM/YY")) {
                                ccChanged = true;
                                if (!CustomerConnect.Util.Validate.CCNumber(cc.CardInfo)) {
                                    swal({
                                        type: 'error',
                                        title: 'Credit Card Update',
                                        text: 'When updating your credit card, please re-enter your full credit card number and expiration.'
                                    });

                                    return;
                                }
                                if (!CustomerConnect.Util.Validate.CCType(cc.CardInfo, $scope.Settings['CreditCardSettings'])) {
                                    swal({
                                        type: 'error',
                                        title: 'Unable to add new credit card',
                                        text: "Your credit card type is not supported."
                                    });

                                    return;
                                }


                                // Card Updated. Mark deleted, re-add with new CC Info and expiration
                                ccSave.push(GetCard(cc));
                                cc.MarkDeleted = true;
                            }
                        }
                    }
                }

                $scope.validateAddressFull().then(function () {
                    dataService.customer.saveCustomer(ci).then(function (data) {
                        if (!data.Failed) {
                            swal({
                                type: 'success',
                                title: 'Update submitted',
                                text: $scope.Settings['Account Update']['Submitted Message']
                            }).then(function () {


                                $scope.reloadCustomerInternal().then(function () {

                                    if (ccChanged && $scope.Customer.IsAR && $scope.Customer.ARBalance) {
                                        $state.go('payment');
                                        return;
                                    }

                                    $scope.reloadForm();
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
                }).catch(function (error) {

                    dialogs.error('Save Customer', error);
                });


            };

            $scope.validateAddressFull = function () {

                return new Promise(function (resolve, reject) {

                    var a = [];
                    var addressType = [];

                    if (!$scope.isEmptyAddress($scope.Customer.PrimaryAddress)) {
                        a.push($scope.validateAddressInternal($scope.Customer.PrimaryAddress));
                        addressType.push("Primary Address");
                    }

                    if ($scope.Settings['Account Update']['Show Delivery Address'] == 1 && !$scope.isEmptyAddress($scope.Customer.DeliveryAddress)) {
                        a.push($scope.validateAddressInternal($scope.Customer.DeliveryAddress));
                        addressType.push("Delivery Address");
                    }


                    if ($scope.Settings['Account Update']['Show Billing Address'] == 1 && !$scope.isEmptyAddress($scope.Customer.BillingAddress)) {
                        a.push($scope.validateAddressInternal($scope.Customer.BillingAddress));
                        addressType.push("Billing Address");
                    }


                    Promise.all(a).then(function (values) {

                        for (var i = 0; i < values.length; i++) {
                            if (!values[i])
                                reject("Unable to locate your " + addressType[i]);
                        }

                        resolve();
                    });

                });
            }

            $scope.reloadCustomer = function () {

                $scope.reloadCustomerInternal().then(function () {
                    $scope.reloadForm();
                });
            }

            $scope.reloadCustomerInternal = function () {
                return new Promise(function (resolve, reject) {
                    dataService.customer.getCustomer().then(function (data) {
                        if (!data.Failed) {
                            userService.setCustomer(data.ReturnObject);
                            //$scope.Customer = angular.copy(userService.getCustomer());
                        }

                        console.log($scope);
                        $scope.accountForm.$setPristine();
                        $scope.accountForm.$setUntouched();

                        resolve();
                    });
                });
            }

            $scope.reloadForm = function () {
                //$state.reload();
                $state.reload($state.current.name);

                $stateParams.reload = !$stateParams.reload;
                $state.transitionTo($state.current, $stateParams, {
                    reload: true, inherit: false, notify: true
                });
            }

            // Undo Form
            $scope.UndoChanges = function () {
                $scope.reloadForm();
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
                    $scope.Customer.Phones.push({ Extension: "", Number: "", PhoneMask: $scope.Settings.LocalitySettings.PhoneMask[0], PhoneType: "Home" });
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
                if ($scope.accountForm.$dirty) {
                    dialogs.error('Delivery Signup', 'You have unsaved changes to account. Please save account options first.');
                    return;
                }

                if (!$scope.primaryAddressValidInternal()) {
                    dialogs.error('Delivery Signup', 'Invalid Primary address. Please set valid primary address and save it.');
                    return;
                }

                if (!isCreditCardValid()) {
                    dialogs.error('Delivery Signup', 'Credit card validation failed. Please add valid credit card and save it.');
                    return;
                }

                var p = validateAddress();
                p.then(function (isAddressValid) {
                    if (isAddressValid)
                        convertToRouteRequest();
                });
            };

            function isCreditCardValid() {
                if ($scope.Settings.Signup.Route['Require Credit Card'] != 1)
                    return true;

                // If using credit card, check to make sure it is valid.
                var cc = $scope.Customer.CreditCards;
                if (cc) {
                    for (var i = 0; i < cc.length; i++)
                        if (cc[i] && CustomerConnect.Util.Validate.CCExpiration(cc[0].CardExpiration))
                            return true;
                    //CustomerConnect.Util.Validate.CCNumber(cc[0].CardInfo, $scope.Settings['CreditCardSettings'])); // Card is already saved, no need to validate number
                }

                // Implicit false.
                return false;
            }

            function validateAddress() {

                return new Promise(function (resolve, reject) {
                    $scope.validateAddressInternal($scope.Customer.PrimaryAddress).then(function (result) {
                        if (!result)
                            dialogs.error('Address validation failed.', data.Message);
                        resolve(result);
                    });
                });

            }

            $scope.validateAddressInternal = function (a) {

                return new Promise(function (resolve, reject) {

                    if ($scope.Settings.General && $scope.Settings.General["Geocoding"]) {
                        var geocodingEnabled = $scope.Settings.General && $scope.Settings.General["Geocoding"]["Enabled"];
                        if (geocodingEnabled != "1")
                            resolve(true);
                    }
                    else
                        resolve(true);

                    //Send address to server for Route validation
                    dataService.customer.checkAddress(a).then(function (data) {
                        if (data.Failed) {
                            //dialogs.error('Address validation failed.', data.Message);
                            resolve(false);
                        } else {
                            resolve(true);
                        }
                    });
                });
            }

            function getCustomerLatLon() {

                var c = $scope.Customer;
                var s = $scope.Settings;

                if (s['Account Update'] && s['Account Update']['Show Delivery Address'] == '1' && c.DeliveryGeoLocation.Latitude != 0 && c.DeliveryGeoLocation.Longitude != 0)
                    return { Latitude: c.DeliveryGeoLocation.Latitude, Longitude: c.DeliveryGeoLocation.Longitude };


                if (c.PrimaryGeoLocation.Latitude == 0 && c.PrimaryGeoLocation.Longitude == 0)
                    return null;

                return { Latitude: c.PrimaryGeoLocation.Latitude, Longitude: c.PrimaryGeoLocation.Longitude };
            }

            function convertToRouteRequest() {

                var p = getCustomerLatLon();

                var isAddressValid = p;

                if (!isAddressValid) {
                    p = { Latitude: 0, Longitude: 0 };
                }

                dataService.customer.convertToDelivery(p).then(function (data) {
                    if (!data.Failed) {

                        var m = 'You have been converted to a delivery account.';
                        if ($scope.Settings["Account Update"] && $scope.Settings["Account Update"]["Delivery Enabled Message"])
                            m = $scope.Settings["Account Update"]["Delivery Enabled Message"];

                        //if (!isAddressValid) {
                        //    dialogs.notify("Delivery Signup Warning", "Unable to geocode your Primary address. Please make sure your primary address is valid.");
                        //}

                        dialogs.notify('Delivery Signup', m);

                        dataService.customer.getCustomer().then(function (cdata) {
                            if (!cdata.Failed) {
                                userService.setCustomer(cdata.ReturnObject);
                                $scope.Customer = angular.copy(userService.getCustomer());
                                $scope.reloadForm();
                            } else {
                                dialogs.error('Retrieval failed.', cdata.Message);
                            }
                        });
                    } else {
                        dialogs.error('Update failed.', data.Message);
                    }
                });
            }

            $scope.isEnableDeliveryVisible = function () {

                var g = $scope.Settings.General;
                if ($scope.Customer.RouteName == '' && g['Route Scheduling'] == 1) {
                    var x = g["Show Enable Delivery Button"];
                    if ((!x) || x == 1)
                        return true;
                }

                return false;
            };


            var validateStateChange = function (continueNavigation) {

                if (!$scope.accountForm.$dirty) {
                    continueNavigation();
                    return;
                }

                swal({
                    title: 'Are you sure?',
                    text: "The form has changed, do you want to continue without saving?",
                    type: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#008cba',
                    cancelButtonColor: '#5cb85c',
                    confirmButtonText: 'Yes, discard changes',
                    cancelButtonText: 'Cancel'
                }).then(function () {
                    continueNavigation();
                }).catch(function () { });

            };


            $scope.printBagTag = function () {
                var data = { Customer: angular.copy($scope.Customer), Settings: $scope.Settings };

                if (!(data.Customer.DeliveryGeoLocation && data.Customer.DeliveryGeoLocation.Latitude && data.Customer.DeliveryGeoLocation.Longitude)) {
                    data.Customer.DeliveryAddress = angular.copy(data.Customer.PrimaryAddress);
                }

                printService.print(settingsService.path + 'Components/Dialogs/BagTagPrint.html', data);
            };

            $scope.DisableAll = function () {

                //confirm
                swal({
                    title: 'Are you sure?',
                    text: "All notification subscriptions will be disabled. Continue?",
                    type: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#008cba',
                    cancelButtonColor: '#5cb85c',
                    confirmButtonText: 'Yes, Unsubscribe',
                    cancelButtonText: 'Cancel'
                }).then(function () {
                    //Set all to disabled
                    $scope.disableSave = true;
                    $scope.notifyOptions.disableAll();
                    //!!todo:save notifications only
                    $scope.SaveNotification();
                    $scope.disableSave = false;

                }).catch(function () { });
            };

            $scope.SaveNotification = function () {

                var p = $scope.SaveNotificationInternal();

                p.then(function (data) {
                    if (!data.Failed) {
                        var dlg = dialogs.notify('Update submitted', 'Your notification settings have been changed.');
                        dlg.result.then(function () {
                            $scope.reloadCustomer();
                        })
                    } else {
                        dialogs.error('Update failed.', data.Message);
                    }
                });
            };

            $scope.SaveNotificationInternal = function () {//Returns promise

                var x = {
                    ClientAccountID: $scope.Customer.ClientAccountID,
                    Notifications: $scope.Customer.Notifications,

                    EmailAddress: $scope.Customer.EmailAddress,
                    EmailAddress2: "",
                    EmailAddress3: "",
                    EmailAddress4: "",
                    Phones: [],

                    loaded: true
                };

                return dataService.customer.saveCustomerNotificationsById(x);
            };

            $scope.NotificationMethodChanged = function () {

                if ($scope.disableSave)
                    return;

                var p = $scope.SaveNotificationInternal();

                p.then(function (data) {
                    if (!data.Failed) {
                        //console.log('$scope.NotificationMethodChanged succeed');
                    } else {
                        console.log('$scope.NotificationMethodChanged failed');
                    }
                });
            }


            $scope.testAddress = function (addressType, field, value, a) {

                console.log('testAddress');
                console.log(addressType);
                console.log(field);

                switch (field) {
                    case "Address1": a.Address1 = value;
                        break;
                    case "Address2": a.Address2 = value;
                        break;
                    case "City": a.City = value;
                        break;
                    case "State": a.State = value;
                        break;
                    case "Zip": a.Zip = value;
                        break;
                }

                var res = $scope.testAddressInternal(a);

                $scope.Validation[addressType] = res;

                console.log(res);
                return res;
            }

            $scope.testAddressInternal = function (a) {
                if ($scope.isEmptyAddress(a))
                    return true;

                if ($scope.isFullAddress(a))
                    return true;

                return false;
            }


            $scope.isEmptyAddress = function (a) {
                return !(a.Address1 || a.Address2 || a.City || a.State || a.Zip);
            }

            $scope.isFullAddress = function (a) {
                return a.Address1 && a.City && a.State && a.Zip;
            }


            $scope.$watchGroup(['Customer.PrimaryAddress.Address1', 'Customer.PrimaryAddress.Address2', 'Customer.PrimaryAddress.City', 'Customer.PrimaryAddress.State', 'Customer.PrimaryAddress.Zip'], function () {
                var res = $scope.testAddressInternal($scope.Customer.PrimaryAddress);
                $scope.Validation.PrimaryAddress = res;
            });

            $scope.$watchGroup(['Customer.DeliveryAddress.Address1', 'Customer.DeliveryAddress.Address2', 'Customer.DeliveryAddress.City', 'Customer.DeliveryAddress.State', 'Customer.DeliveryAddress.Zip'], function () {
                var res = $scope.testAddressInternal($scope.Customer.DeliveryAddress);
                $scope.Validation.DeliveryAddress = res;
            });

            $scope.$watchGroup(['Customer.BillingAddress.Address1', 'Customer.BillingAddress.Address2', 'Customer.BillingAddress.City', 'Customer.BillingAddress.State', 'Customer.BillingAddress.Zip'], function () {
                var res = $scope.testAddressInternal($scope.Customer.BillingAddress);
                $scope.Validation.BillingAddress = res;
            });



            CheckStateChangeService.checkFormOnStateChange($scope, validateStateChange);

            // Initialize Customer
            $scope.initCustomer();
        };


    }
})();