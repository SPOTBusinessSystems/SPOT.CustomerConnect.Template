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
            $scope.Settings = configService.getProfile();


            $scope.Login = { emailAddress: '', password: '', rememberEmail: false };


            if (localStorageService.get(CustomerConnect.Config.Tenant + '_e') != null) {
                userService.setEmail(CustomerConnect.Util.base64._decode(localStorageService.get(CustomerConnect.Config.Tenant + '_e')));
            }

            if (userService.getEmail() != '' && typeof (userService.getEmail()) != 'undefined') {
                $scope.Login.emailAddress = userService.getEmail();
                $scope.Login.rememberEmail = true;
            }

            var p = userService.getPassword();
            if (p && p.Valid && p.Password)
                $scope.Login.password = p.Password;

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
                if (!$scope.Login.emailAddress || !$scope.Login.password) {
                    return;
                }

                dataService.user.login($scope.Login.emailAddress, $scope.Login.password).then(function (data) {
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

                        if ($scope.Login.rememberEmail) {
                            localStorageService.set(CustomerConnect.Config.Tenant + '_e', CustomerConnect.Util.base64._encode($scope.Login.emailAddress));
                        } else {
                            localStorageService.remove(CustomerConnect.Config.Tenant + '_e');
                        }

                        $scope.getCustomer();
                    } else {
                        dialogs.error('Login Failed', data.Message);
                    }
                })
            };

            $scope.loginByToken = function (authToken) {

                dataService.user.loginByToken(authToken).then(function (data) {
                    if (!data.Failed) {
                        apiConfig.setSessionId(data.ReturnObject.SessionID);
                        CustomerConnect.Config.SessionId = data.ReturnObject.SessionID;

                        if (data.ReturnObject.PasswordComment != null) {
                            $scope.requiresPasswordChange = true;
                        }

                        localStorageService.set(CustomerConnect.Config.Tenant + '_token', data.ReturnObject.SessionID);
                        $scope.getCustomer();
                    } else {
                        dialogs.error('Login Failed', data.Message);
                    }
                })
            };

            $scope.createAccount = function () {
                userService.setEmail($scope.Login.emailAddress);
                userService.setPassword($scope.Login.password);
                $state.go('signup');
            };

            $scope.forgotPassword = function () {
                if (!$scope.Login.emailAddress) {
                    return;
                }

                var ip = "1.1.1.1";

                dataService.user.passwordReminder({ emailAddress: $scope.Login.emailAddress, ipAddress: ip, sendEmail: true, resetFinishURL: $scope.getFinishUrl('%code%') }).then(function (data) {
                    if (!data.Failed) {
                        dialogs.notify('Email Sent', 'A password change email has been sent to your email address.');
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
                $scope.Login.emailAddress = $stateParams.forgotPasswordEmail;
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
                return CustomerConnect.Util.Validate.EmailAddress($scope.Login.emailAddress);
            };

            $scope.GiftCard = { Numbers: '', ErrorMessage: '', BalanceResult: null };

            $scope.getGiftCardsBalances = function () {
                var numbers = $scope.GiftCard.Numbers.split(',');
                dataService.customer.retrieveGiftCardsBalances(numbers).then(function (d) {
                    if (d.Failed) {
                        $scope.GiftCard.ErrorMessage = d.Message;
                        $scope.GiftCard.BalanceResult = null;
                    } else {
                        $scope.GiftCard.ErrorMessage = '';
                        $scope.GiftCard.BalanceResult = d.ReturnObject;
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

            if ($stateParams.authtoken) {
                $scope.loginByToken($stateParams.authtoken);
            }

        })();
    };
})();