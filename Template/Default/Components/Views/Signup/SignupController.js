(function () {
    'use strict';

    angular
    .module('app')
    .controller('SignupController', SignupController);

    SignupController.$inject = ['$scope', 'dialogs', 'blockUI', '$state', 'userService', '$stateParams', '$rootScope', 'vcRecaptchaService', 'dataService', 'configService'];

    function SignupController($scope, dialogs, blockUI, $state, userService, $stateParams, $rootScope, vcRecaptchaService, dataService, configService) {
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
                PhoneType: 'Choose Type',
                ReferringCustomerKey: $stateParams.refkey,
                CaptchaValid: userService.getCaptchaValid(),
                ReferralSource: "",
                ReferralDetail: "",
                AcceptTerms: false
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
                        return (CustomerConnect.Util.Validate.CCExpiration($scope.Customer.CreditCardsToSave[0].CardExpiration) && CustomerConnect.Util.Validate.CCNumber($scope.Customer.CreditCardsToSave[0].CardInfo));
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

            $scope.storePass = function (pass) {
                console.log('storepass');
                console.log($scope.Customer);
                console.log(pass);
            };

            $scope.SaveCustomer = function () {
                console.log($scope.Customer);

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
                            number: $scope.Customer.PhoneNumber,
                            phoneType: $scope.Customer.PhoneType,
                            phoneMask: $scope.Settings.General['Phone Mask']
                        }],

                    primaryAddress: {
                        Address1: $scope.Customer.Address1,
                        Address2: $scope.Customer.Address2,
                        City: $scope.Customer.City,
                        State: $scope.Customer.State,
                        Zip: $scope.Customer.Zip
                    },
                    referringCustomerKey: $scope.Customer.ReferringCustomerKey,
                    comments: $scope.Customer.Comments
                };

                if ($scope.Settings.Signup['Terms and Conditions Acceptance Required'] == 1) {
                    ci.acceptTerms = $scope.Customer.AcceptTerms ? 1 : 0;
                }

                if ($scope.Customer.CreditCardsToSave) {
                    if ($scope.Customer.CreditCardsToSave[0]) {
                        ci.CreditCardsToSave = [{ Number: $scope.Customer.CreditCardsToSave[0].CardInfo, Expiration: $scope.Customer.CreditCardsToSave[0].CardExpiration }];
                    }
                }

                console.log(ci);

                dataService.customer.signupCustomer(ci).then(function (data) {
                    if (!data.Failed) {
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
        })();
    }
})();