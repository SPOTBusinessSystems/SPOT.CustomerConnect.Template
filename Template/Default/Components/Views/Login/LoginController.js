(function () {
    'use strict';

    angular
    .module('app')
    .controller('LoginController', LoginController);

    LoginController.$inject = ['$compile', '$rootScope', '$scope', '$state', 'dialogs', 'blockUI', 'localStorageService', 'userService', 'settingsService', 'dataService', 'configService', 'apiConfig', '$stateParams'];

    function LoginController($compile, $rootScope, $scope, $state, dialogs, blockUI, localStorageService, userService, settingsService, dataService, configService, apiConfig, $stateParams) {
        /* jshint validthis:true */
        var vm = this;
        vm.title = 'LoginController';

        (function () {
            $scope.configService = configService;
            $scope.requiresPasswordChange = false;


            if (localStorageService.get(CustomerConnect.Config.Tenant + '_e') != null) {
                userService.setEmail(CustomerConnect.Util.base64._decode(localStorageService.get(CustomerConnect.Config.Tenant + '_e')));
            }

            if (userService.getEmail() != '' && typeof (userService.getEmail()) != 'undefined') {
                $scope.emailAddress = userService.getEmail();
                $scope.rememberEmail = true;
            }

            if (userService.getPassword() != '') {
                $scope.password = userService.getPassword();
            }

            // Return to returnState after login
            if ($stateParams.returnState) {
                $scope.returnState = $stateParams.returnState;
            } else {
                $scope.returnState = null;
            }

            $scope.getCustomer = function () {
                dataService.customer.getCustomer().then(function (data) {
                    if (!data.Failed) {
                        CustomerConnect.Config.Customer = data.ReturnObject;
                        userService.setCustomer(data.ReturnObject);

                        dataService.user.getMessages().then(function (data) {
                            if (!data.Failed) {
                                userService.setMessages(data.ReturnObject);
                                $scope.unreadMessages = userService.unreadMessageCount();
                            } else {
                                dialogs.error('Messages Error', 'Unable to load messages.')
                            }

                            if ($scope.returnState)
                                $state.go($scope.returnState);
                            else
                                $state.go('account', { requirePasswordChange: $scope.requiresPasswordChange });
                        });
                    } else {
                        dialogs.error('Load Failed', data.Message);
                    }
                });
            };

            $scope.loginUser = function () {
                if (!$scope.emailAddress || !$scope.password) {
                    return;
                }

                dataService.user.login($scope.emailAddress, $scope.password).then(function (data) {
                    if (!data.Failed) {
                        apiConfig.setSessionId(data.ReturnObject.SessionID);
                        CustomerConnect.Config.SessionId = data.ReturnObject.SessionID;

                        if (data.ReturnObject.PasswordComment != null) {
                            $scope.requiresPasswordChange = true;

                            //var dlg = dialogs.notify('Password Change Required', data.ReturnObject.PasswordComment);
                            //dlg.result.then(function () {
                            //    $scope.changePassword();
                            //});
                        }

                        localStorageService.set(CustomerConnect.Config.Tenant + '_token', data.ReturnObject.SessionID);

                        if ($scope.rememberEmail) {
                            localStorageService.set(CustomerConnect.Config.Tenant + '_e', CustomerConnect.Util.base64._encode($scope.emailAddress));
                        } else {
                            localStorageService.remove(CustomerConnect.Config.Tenant + '_e');
                        }

                        $scope.getCustomer();
                    } else {
                        dialogs.error('Login Failed', data.Message);
                    }
                })
            };

            $scope.createAccount = function () {
                userService.setEmail($scope.emailAddress);
                userService.setPassword($scope.password);
                $state.go('signup');
            };

            $scope.sendPasswordEmail = function (templateData) {
                CustomerConnect.Customer.SendEmail({ ToAddress: $scope.emailAddress, Template: 7, Data: JSON.stringify(templateData) })
                    .done(function () {
                        dialogs.notify('Email Sent', 'A password change email has been sent to your email address.');
                    }).fail(function (emailData) {
                        dialogs.error('Error Sending Email', emailData.Message);
                    });
            };

            $scope.forgotPassword = function () {
                if (!$scope.emailAddress) {
                    return;
                }

                var ip = "1.1.1.1";

                dataService.user.passwordReminder({ emailAddress: $scope.emailAddress, ipAddress: ip }).then(function (data) {
                    if (!data.Failed) {
                        var templateData = { IPAddress: ip, RememberKey: data.ReturnObject.RememberKey, FinishUrl: $scope.getFinishUrl(data.ReturnObject.RememberKey) };
                        $scope.sendPasswordEmail(templateData);
                    } else {
                        dialogs.error('Password Reminder Error', data.Message);
                    }
                });
            };

            $scope.getFinishUrl = function (key) {

                var path;
                if (CustomerConnect.Config.ReminderURL)
                    path = CustomerConnect.Config.ReminderURL;
                else
                    path = window.location.origin + window.location.pathname;

                return path + '#/reminder/' + key;
            }

            if ($stateParams.forgotPasswordEmail) {
                $scope.emailAddress = $stateParams.forgotPasswordEmail;
                $scope.forgotPassword();
            }

            //$scope.changePassword = function () {
            //    var dlg = dialogs.create(settingsService.path + 'Components/Dialogs/ChangePassword.html', 'DialogController', $scope.data, { size: 'sm' });
            //    dlg.result.then(function (data) {
            //        if (typeof (data) !== 'undefined') {
            //            dataService.user.changePassword(data.Password).then(function (data) {
            //                if (!data.Failed) {
            //                    dialogs.notify('Password Changed', 'Your password has been changed.');
            //                } else {
            //                    var dlge = dialogs.notify('Error', cpData.Message);
            //                    dlge.result.then(function () {
            //                        $scope.changePassword();
            //                    });
            //                }

            //            });
            //        }
            //    });
            //};

            $scope.validEmail = function () {
                return CustomerConnect.Util.Validate.EmailAddress($scope.emailAddress);
            };

            $scope.giftCardNumbers = '';
            $scope.checkGiftCardBalanceErrorMessage = '';
            $scope.checkGiftCardBalanceResult = null;

            $scope.getGiftCardsBalances = function () {
                var numbers = $scope.giftCardNumbers.split(',');
                dataService.customer.retrieveGiftCardsBalances(numbers).then(function (d) {
                    if (d.Failed) {
                        $scope.checkGiftCardBalanceErrorMessage = d.Message;
                        $scope.checkGiftCardBalanceResult = null;
                    } else {
                        $scope.checkGiftCardBalanceErrorMessage = '';
                        $scope.checkGiftCardBalanceResult = d.ReturnObject;
                    }
                });
            };

            if (localStorageService.get(CustomerConnect.Config.Tenant + '_token') != null) {
                CustomerConnect.Config.SessionId = localStorageService.get(CustomerConnect.Config.Tenant + '_token');
                apiConfig.setSessionId(CustomerConnect.Config.SessionId);

                dataService.customer.getCustomer().then(function (data) {
                    if (!data.Failed) {
                        userService.setCustomer(data.ReturnObject);

                        dataService.user.getMessages().then(function (data) {
                            if (!data.Failed) {
                                userService.setMessages(data.ReturnObject);
                            } else {
                                dialogs.error('Messages Error', 'Unable to load messages.')
                            }

                            if ($scope.returnState)
                                $state.go($scope.returnState);
                            else
                                $state.go('account');
                        });

                    } else {
                        //dialogs.error('Load Failed', 'Unable to retrieve customer data. Please login again.');
                        localStorageService.remove(CustomerConnect.Config.Tenant + '_token');
                        window.location.reload();
                    }
                });
            }
        })();
    };
})();