(function () {
    'use strict';

    angular
    .module('app')
    .controller('SignupController', SignupController);

    SignupController.$inject = ['$scope', 'dialogs', 'blockUI', '$state', 'userService', '$stateParams', '$rootScope', 'vcRecaptchaService', 'dataService', 'configService', '$window', 'WizardHandler', 'facebookPixelTrackingService', 'googleAnalyticsService'];

    function SignupController($scope, dialogs, blockUI, $state, userService, $stateParams, $rootScope, vcRecaptchaService, dataService, configService, $window, WizardHandler, facebookPixelTrackingService, googleAnalyticsService) {
        /* jshint validthis:true */
        var vm = this;
        vm.title = 'SignupController';

        (function () {
            $scope.Settings = configService.getProfile();

            // Settings needed for signup didn't load yet.
            if (!$scope.Settings) {
                $state.go('login');
            }

            $scope.Customer = {
                Type: "DELIVERY",
                Email: userService.getEmail(),
                Phone: {
                    Number: null,
                    PhoneMask: $scope.Settings.LocalitySettings.PhoneMask[0],
                    PhoneType: 'Cell/Mobile',// 'Choose Type',
                },
                ReferringCustomerKey: $stateParams.refkey,
                CaptchaValid: userService.getCaptchaValid(),
                ReferralSource: "",
                ReferralDetail: "",
                AcceptTerms: false,
                CustomerRouteInfo: {
                    PickupType: null,
                    DeliveryType: null
                }
            };

            // Init
            if ($stateParams.refid) {
                dataService.customer.retrieveReferralInfo($stateParams.refid).then(function (data) {
                    if (!data.Failed) {
                        $scope.Customer.Email = data.ReturnObject.EmailAddress;
                        $scope.Customer.FirstName = data.ReturnObject.FirstName;
                        $scope.Customer.LastName = data.ReturnObject.LastName;
                        $scope.Customer.ReferralCode = data.ReturnObject.ReferralCode;
                        $scope.Customer.ReferralId = $stateParams.refid;
                    }
                });
            }

            $scope.Customer.Password = { Password: '', PasswordConfirm: '', Valid: false, Done: false };

            // if cc shown todo
            if ($scope.Settings.Signup['Prompt for Credit Card'] == 1) {
                $scope.Customer.CreditCardsToSave = [{ CardInfo: null, CardExpiration: null }];
            }

            $scope.finishedWizard = function () {
                if (userService.getCaptchaValid() || $scope.Settings.General['Enable Captcha'] == 0) {
                    $scope.SaveCustomer();
                } else {
                    if (vcRecaptchaService.getResponse($scope.CaptchaID) === "") {
                        dialogs.error('Captcha Error', 'Please resolve the captcha before sending.');
                    } else {
                        dataService.settings.validateCaptcha(vcRecaptchaService.getResponse($scope.CaptchaID)).then(function (data) {
                            if (!data.Failed) {
                                userService.setCaptchaValid(true);
                                $scope.SaveCustomer();
                            } else {
                                dialogs.error('Captcha Error', 'Unable to validate captcha. Please refresh your browser.');
                            }
                        });
                    }
                }
            };

            $scope.addressValid = function () {
                return ($scope.Customer.Address1 && $scope.Customer.City && $scope.Customer.State && $scope.Customer.Zip);
            };

            $scope.ccValid = function () {
                // If using credit card, check to make sure it is valid.
                if ($scope.Customer.CreditCardsToSave) {
                    if ($scope.Customer.CreditCardsToSave[0]) {
                        return (CustomerConnect.Util.Validate.CCExpiration($scope.Customer.CreditCardsToSave[0].CardExpiration) && CustomerConnect.Util.Validate.CCNumber($scope.Customer.CreditCardsToSave[0].CardInfo, $scope.Settings['CreditCardSettings']));
                    }
                }

                // Implicit false.
                return false;
            };

            $scope.checkEmailHasError = false;
            $scope.checkEmailErrorMessage = '';

            $scope.validEmail = function () {
                return CustomerConnect.Util.Validate.EmailAddress($scope.Customer.Email) && !$scope.checkEmailHasError;
            };

            $scope.checkEmail = function () {
                dataService.customer.checkEmail($scope.Customer.Email).then(function (d) {
                    var data = d.data;
                    if (!data.Failed) {
                        $scope.checkEmailHasError = false;
                        $scope.checkEmailErrorMessage = '';
                    } else {
                        $scope.checkEmailHasError = true;
                        $scope.checkEmailErrorMessage = data.Message;
                    }
                });
            };

            $scope.checkEmailErrorIsDuplicateEmail = function () {
                return $scope.checkEmailErrorMessage === 'Email address already exists.';
            };

            $scope.goToLoginPage = function () {
                $state.go('login');
            };
            $scope.goToLoginPangeAndResetPassword = function () {
                $state.go('login', { forgotPasswordEmail: $scope.Customer.Email });
            };

            if ($scope.Customer.Email) {
                $scope.checkEmail();
            }

            $scope.Params = {
                HasPickupType: false,
                HasDeliveryType: false,
                RoutePickupTypeDescription: null,
                RouteDeliveryTypeDescription: null
            };

            //!!Debug stub!!! Remove it!!!
            //$scope.Settings.Signup['Route Pickup Type Description'] = "Pickup type desctription";
            //$scope.Settings.Signup['Route Delivery Type Description'] = "Delivery type description";

            if ($scope.Settings.Signup['Route Pickup Type Description'])
                $scope.Params.RoutePickupTypeDescription = $scope.Settings.Signup['Route Pickup Type Description'];

            if ($scope.Settings.Signup['Route Delivery Type Description'])
                $scope.Params.RouteDeliveryTypeDescription = $scope.Settings.Signup['Route Delivery Type Description'];

            $scope.SaveCustomer = function () {

                var ci = {
                    clientAccountID: '',
                    firstName: $scope.Customer.FirstName,
                    lastName: $scope.Customer.LastName,
                    name: $scope.Customer.LastName + ', ' + $scope.Customer.FirstName,
                    emailAddress: $scope.Customer.Email,
                    serviceType: $scope.Customer.Type,
                    password: $scope.Customer.PasswordField.Password,
                    referralCode: $scope.Customer.ReferralCode,
                    referralSource: $scope.Customer.ReferralSource,
                    referralDetail: $scope.Customer.ReferralDetail,
                    awardId: $scope.Customer.AwardId,
                    phones: [
                        {
                            number: $scope.Customer.Phone.Number,
                            phoneType: $scope.Customer.Phone.PhoneType,
                            phoneMask: $scope.Customer.Phone.PhoneMask,//$scope.Settings.LocalitySettings.PhoneMask[0]
                        }],

                    primaryAddress: {
                        Address1: $scope.Customer.Address1,
                        Address2: $scope.Customer.Address2,
                        City: $scope.Customer.City,
                        State: $scope.Customer.State,
                        Zip: $scope.Customer.Zip
                    },
                    referringCustomerKey: $scope.Customer.ReferringCustomerKey,
                    comments: $scope.Customer.Comments,
                    Locker: $scope.Customer.Locker,
                    LockerPIN: $scope.Customer.LockerPIN
                };

                if ($scope.Settings.Signup['Terms and Conditions Acceptance Required'] == 1) {
                    ci.acceptTerms = $scope.Customer.AcceptTerms ? 1 : 0;
                }

                if ($scope.isCardAvailable()) {
                    ci.CreditCardsToSave = [{ Number: $scope.Customer.CreditCardsToSave[0].CardInfo, Expiration: $scope.Customer.CreditCardsToSave[0].CardExpiration }];
                }

                if ($scope.Customer.CustomerRouteInfo.PickupType != null || $scope.Customer.CustomerRouteInfo.DeliveryType != null) {
                    ci.CustomerRouteInfo = {
                        PickupType: $scope.Customer.CustomerRouteInfo.PickupType,
                        DeliveryType: $scope.Customer.CustomerRouteInfo.DeliveryType
                    }
                }

                dataService.customer.signupCustomer(ci).then(function (data) {
                    if (!data.Failed) {

                        //adwords tracking
                        if ($scope.Settings.General && $scope.Settings.General["Google Adwords"]) {

                            var conversionID = $scope.Settings.General["Google Adwords"]["Conversion ID"];

                            if (conversionID && $window.google_trackConversion) {
                                console.log("google adwords tracking");
                                $window.google_trackConversion({
                                    google_conversion_id: conversionID,
                                    google_remarketing_only: false
                                });
                            }
                        }

                        facebookPixelTrackingService.trackEvent("SignupComplete");
                        googleAnalyticsService.pageview('/SignupComplete');


                        dialogs.notify('Signup submitted', $scope.Settings.Signup['Submitted Message']);
                        userService.setEmail($scope.Customer.Email);
                        userService.setPassword($scope.Customer.Password);

                        $state.go('login');
                    } else {
                        dialogs.error('Signup failed.', data.Message);
                    }
                });
            };

            $scope.setWidgetId = function (widgetId) {
                $scope.CaptchaID = widgetId;
            };

            $scope.isSaveDisabled = function () {
                if (!($scope.Settings.Signup['Terms and Conditions Acceptance Required'] == 1))
                    return false;

                if ($scope.Customer.AcceptTerms)
                    return false;

                return true;
            };

            $scope.isAddressValid = function () {
                if ($scope.Customer.Type != 'DELIVERY')//No delivery, no address testing required
                    return true;

                if ($scope.Settings.General && $scope.Settings.General["Geocoding"]) {
                    var geocodingEnabled = $scope.Settings.General && $scope.Settings.General["Geocoding"]["Enabled"];

                    if (geocodingEnabled != "1")
                        return true;
                }
                else
                    return true;

                return new Promise(function (resolve, reject) {
                    //Send address to server for Route validation
                    dataService.customer.checkAddress($scope.Customer).then(function (data) {
                        if (data.Failed) {
                            dialogs.error('Address validation failed.', data.Message);
                            resolve(false);
                        } else {
                            resolve(true);
                        }
                    });
                });
            };

            $scope.isCardAvailable = function () {
                return $scope.Customer.CreditCardsToSave && $scope.Customer.CreditCardsToSave[0] && $scope.Customer.CreditCardsToSave[0].CardInfo != null;
            };

            $scope.setPin = function () {
                if ($scope.Customer.Type == 'LOCKER') {

                    $scope.Customer.Locker = "Y";
                    var onlyNumbers = $scope.Customer.Phone.Number.replace(/\D/g, '');
                    $scope.Customer.LockerPIN = onlyNumbers.substring(onlyNumbers.length - 4);
                }
                else {
                    $scope.Customer.Locker = undefined;
                    $scope.Customer.LockerPIN = undefined;
                }
            };

            $scope.setCustomerType = function (customerType) {
                //RETAIL, DELIVERY

                //!!Debug stub!!! Remove it!!!
                //$scope.Settings.Signup['Allow Choose Route Pickup Type'] = 1;
                //$scope.Settings.Signup['Allow Choose Route Delivery Type'] = 1;

                if (customerType == 'DELIVERY' && ($scope.Settings.Signup['Allow Choose Route Pickup Type'] == 1 || $scope.Settings.Signup['Allow Choose Route Delivery Type'] == 1)) {

                    $scope.Customer.Type = customerType;

                    $scope.Params.HasPickupType = $scope.Settings.Signup['Allow Choose Route Pickup Type'] == 1;
                    $scope.Params.HasDeliveryType = $scope.Settings.Signup['Allow Choose Route Delivery Type'] == 1;

                    //console.log('delivery');
                    //console.log($scope.Params);

                    return;
                }
                else {
                    $scope.updateCustomerType(customerType);
                    WizardHandler.wizard('SignupWizard').next();
                }
            };

            $scope.updateCustomerType = function (customerType) {
                $scope.Customer.Type = customerType;
                $scope.setPin();

                $scope.Params.HasPickupType = false;
                $scope.Params.HasDeliveryType = false;

                $scope.Customer.CustomerRouteInfo.PickupType = null;
                $scope.Customer.CustomerRouteInfo.DeliveryType = null;
            }

            facebookPixelTrackingService.load($scope.Settings,
                function () {
                    //console.log("StartSignup");
                    facebookPixelTrackingService.trackEvent("StartSignup");
                    googleAnalyticsService.pageview('/StartSignup');
                });

            $scope.$on('wizard:stepChanged', function (event, args) {

                switch (args.step.wzTitle) {
                    case "Type":

                        facebookPixelTrackingService.trackEvent("ServicePreference");
                        googleAnalyticsService.pageview('/ServicePreference');
                        //console.log('ServicePreference');
                        break;
                    case "Address":

                        if ($scope.Settings.Signup["Disable Delivery"] == 1) {
                            $scope.updateCustomerType('RETAIL');
                        }

                        facebookPixelTrackingService.trackEvent("ContactDetails");
                        googleAnalyticsService.pageview('/ContactDetails');
                        //console.log('ContactDetails');
                        break;
                    case "Credit Card":
                        googleAnalyticsService.pageview('/SignupCreditCard');
                        break;
                    case "Note":
                        googleAnalyticsService.pageview('/SignupNote');
                        break;
                    case "Confirm":
                        facebookPixelTrackingService.trackEvent("ConfirmDetails");
                        googleAnalyticsService.pageview('/ConfirmDetails');
                        //console.log('ConfirmDetails');
                        break;
                }
            });

        })();
    }
})();