(function () {
    'use strict';

    angular
    .module('app')
    .controller('SignupController', SignupController);

    SignupController.$inject = ['$scope','dialogs','blockUI','$state','userService','$stateParams','$rootScope','vcRecaptchaService','dataService','configService'];

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
                ReferringCustomerKey: $stateParams.key,
                CaptchaValid: userService.getCaptchaValid()
            };

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
                                dialogs.error('Captcha Error', 'Unable to validate captcha. Please refresh your browser.')
                            }
                        });
                    }
                }
            };

            $scope.addressValid = function () {
                return false;
            };

            $scope.validEmail = function () {
                return CustomerConnect.Util.Validate.EmailAddress($scope.Customer.Email);
            }

            $scope.storePass = function (pass) {
                $scope.Customer.Password = pass;
            }

            $scope.SaveCustomer = function () {
                var ci = {
                    accountNodeID: $scope.Settings.Signup['Default Store Id'],
                    clientAccountID: '',
                    firstName: $scope.Customer.FirstName,
                    lastName: $scope.Customer.LastName,
                    name: $scope.Customer.LastName + ', ' + $scope.Customer.FirstName,
                    emailAddress: $scope.Customer.Email,
                    serviceType: $scope.Customer.Type,
                    password: $scope.Customer.Password,
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
                    referringCustomerKey: $scope.Customer.ReferringCustomerKey
                };

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
        })();
    };
})();