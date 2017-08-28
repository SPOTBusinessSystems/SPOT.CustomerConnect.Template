(function () {
    'use strict';

    angular
    .module('app')
    .controller('MessageController', MessageController);

    MessageController.$inject = ['$rootScope', '$scope', 'dialogs', 'blockUI', 'vcRecaptchaService', 'userService', 'settingsService', 'dataService', '$uibModalInstance', 'data'];

    function MessageController($rootScope, $scope, dialogs, blockUI, vcRecaptchaService, userService, settingsService, dataService, $uibModalInstance, data) {
        /* jshint validthis:true */
        var vm = this;
        vm.title = 'MessageController';

        activate();

        function activate() {
            $scope.Reply = false;
            $scope.Message = data;

            $scope.view = { template: data.Message, tokens: null };

            $scope.close = function () {
                $uibModalInstance.close();
            };

            $scope.reply = function () {
                $scope.Reply = true;
            };

            $scope.sendReply = function () {
                dataService.user.sendMessage('RE: ' + $scope.Message.Subject, $scope.messageBody + '\r\n-----------------\r\n' + $scope.Message.Message, null).then(function (data) {
                    if (data.Failed == false) {
                        $scope.messageBody = null;
                        $scope.Reply = false;

                        dialogs.notify('Reply Sent', 'Your reply has been sent.');
                    } else {
                        dialogs.error('Messages Error', 'Unable send message.');
                    }
                });
            };

            $scope.delete = function () {
                dataService.user.deleteMessage($scope.Message.MessageID).then(function (data) {
                    if (data.Failed == false) {
                        dataService.user.getMessages().then(function (data) {
                            if (data.Failed == false) {
                                //console.log(data);
                                userService.setMessages(data.ReturnObject);
                            }

                            $scope.close();
                        });
                    } else {
                        dialogs.error('Messages Error', 'Error deleting message.');
                    }
                });
            };

            $scope.cancelReply = function () {
                $scope.messageBody = null;
                $scope.Reply = false;
            };
        };
    }
})();