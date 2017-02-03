(function () {
    'use strict';

    angular
    .module('app')
    .controller('MessagesController', MessagesController);

    MessagesController.$inject = ['$rootScope', '$scope', 'dialogs', 'blockUI', 'vcRecaptchaService', 'userService', 'settingsService', 'dataService', '$uibModalInstance', '$ocLazyLoad'];

    function MessagesController($rootScope, $scope, dialogs, blockUI, vcRecaptchaService, userService, settingsService, dataService, $uibModalInstance, $ocLazyLoad) {
        /* jshint validthis:true */
        var vm = this;
        vm.title = 'MessagesController';

        activate();

        function activate() {
            $scope.unreadMessages = "";
            $scope.filteredMessages = [];
            $scope.itemsPerPage = 10;
            $scope.currentPage = 1;

            $scope.numPages = function () {
                return Math.ceil($scope.Messages.length / $scope.numPerPage);
            };

            $scope.figureOutMessagesToDisplay = function () {
                var begin = (($scope.currentPage - 1) * $scope.itemsPerPage);
                var end = begin + $scope.itemsPerPage;
                $scope.filteredMessages = [];
                if ($scope.Messages != null && $scope.Messages.length > 0) {
                    $scope.filteredMessages = $scope.Messages.slice(begin, end);
                }
            };

            $scope.pageChanged = function () {
                $scope.figureOutMessagesToDisplay();
            };

            $scope.close = function () {
                $scope.filteredMessages = [];
                $scope.selectedMessage = null;
                $uibModalInstance.close();
            };

            $scope.open = function (index) {
                //console.log($scope.filteredMessages[index]);
                dataService.user.readMessage($scope.filteredMessages[index].MessageID).then(function (data) {

                });

                var p = $ocLazyLoad.load(settingsService.path + 'Components/Dialogs/Message/MessageController.js');
                p.then(function () {

                    var dlg = dialogs.create(settingsService.path + 'Components/Dialogs/Message/Message.html', 'MessageController', $scope.filteredMessages[index], 'md').result.then(function () {
                        $scope.LoadMessages();
                    });
                });
            }

            $scope.refresh = function () {
                dataService.user.getMessages().then(function (data) {
                    if (!data.Failed) {
                        userService.setMessages(data.ReturnObject);
                        $scope.LoadMessages();
                    } else {
                        dialogs.error('Messages Error', 'Unable to load messages.')
                    }
                });
            }

            $scope.LoadMessages = function () {
                $scope.selectedMessage = null;

                dataService.user.getMessages().then(function (data) {
                    if (data.Failed == false) {
                        userService.setMessages(data.ReturnObject);
                        $scope.Messages = userService.getMessages();
                        $scope.unreadMessages = userService.unreadMessageCount();
                        $scope.figureOutMessagesToDisplay();
                    }
                });
            };

            $scope.LoadMessages();
        };
    }
})();