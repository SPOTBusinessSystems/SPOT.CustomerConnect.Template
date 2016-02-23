(function () {
    'use strict';

    angular
    .module('app')
    .controller('SendMessageController', SendMessageController);

    SendMessageController.$inject = ['$rootScope','$scope','dialogs','blockUI','vcRecaptchaService','userService','settingsService','dataService'];

    function SendMessageController($rootScope, $scope, dialogs, blockUI, vcRecaptchaService, userService, settingsService, dataService) {
        /* jshint validthis:true */
        var vm = this;
        vm.title = 'SendMessageController';

        activate();

        function activate() {
            $scope.open = function (invoiceId, invoiceKey) {
                $scope.data = {
                    LoggedIn: $rootScope.LoggedIn,
                    InvoiceId: invoiceId,
                    InvoiceKey: invoiceKey,
                    Settings: $rootScope.Settings,
                    CaptchaValid: userService.getCaptchaValid()
                };

                if (typeof (invoiceId) == 'undefined') {
                    $scope.data.InvoiceId = null;
                }

                var dlg = dialogs.create(settingsService.path + 'Components/Dialogs/SendMessage.html', 'DialogController', $scope.data);
                dlg.result.then(function (data) {
                    if (typeof (data) != 'undefined') {
                        if (data.name != null) {
                            data.messageBody = data.name + '\n' + data.emailAddress + '\n\n' + data.messageBody;
                        }

                        if (userService.getCaptchaValid() || $scope.data.Settings.General['Enable Captcha'] == 0) {
                            $scope.sendMessage(data);
                        } else {
                            if (vcRecaptchaService.getResponse($scope.CaptchaID) === "") {
                                dialogs.error('Captcha Error', 'Please resolve the captcha before sending.');
                            } else {
                                dataService.settings.validateCaptcha(vcRecaptchaService.getResponse()).then(function (data) {
                                    if (!data.Failed) {
                                        userService.setCaptchaValid(true);
                                        $scope.sendMessage(data);
                                    } else {
                                        dialogs.error('Captcha Error', 'Unable to validate captcha. Please refresh your browser.')
                                    }
                                });
                            }
                        }
                    }
                });
            };

            $scope.sendMessage = function (data) {
                dataService.user.sendMessage(data.subject, data.messageBody, $scope.data.InvoiceId).then(function (data) {
                    if (!data.Failed) {
                        dialogs.notify('Message Sent', 'Your message has been sent successfully.');
                    } else {
                        dialogs.error('Sending Error', 'Your message was not able to be sent. Please try again.');
                        $scope.open(invoiceId, invoiceKey);
                    }
                });
            };

            $scope.setWidgetId = function (widgetId) {
                $scope.CaptchaID = widgetId;
            };
        };
    }
})();