(function () {
    'use strict';

    angular
    .module('app')
    .controller('NotificationsController', NotificationsController);

    NotificationsController.$inject = ['$scope', '$stateParams', 'localStorageService', 'apiConfig', 'dataService', '$http', '$filter', 'configService', '$state', 'dialogs'];

    function NotificationsController($scope, $stateParams, localStorageService, apiConfig, dataService, $http, $filter, configService, $state, dialogs) {
        $scope.Customer = { Notifications: [], loaded: false };
        $scope.Settings = configService.getProfile();
        $scope.Settings.Notifications = $filter('orderBy')($scope.Settings.Notifications, ['Description', 'MethodName'], false);

        $scope.Init = function () {
            if ($stateParams.Id) {
                dataService.customer.getCustomerNotificationsById($stateParams.Id).then(function (data) {
                    console.log('get customer notifications');
                    console.log(data);

                    if (!data.Failed) {
                        $scope.Customer.ClientAccountID = $stateParams.Id;
                        $scope.Customer.Notifications = data.ReturnObject.Notifications;
                        $scope.Customer.loaded = true;
                        $scope.Customer.Notifications = $filter('orderBy')($scope.Customer.Notifications, 'NotificationTypeDescription', false);
                        $scope.EmailAddress = data.ReturnObject.EmailAddress;
                    } else {
                        console.log($scope.Customer.Notifications.length);
                    }
                });
            }
        };

        // Undo Form
        $scope.UndoChanges = function () {
            $state.reload();
        };

        $scope.SaveAccount = function () {
            dataService.customer.saveCustomerNotificationsById($scope.Customer).then(function (data) {
                if (!data.Failed) {
                    var dlg = dialogs.notify('Update submitted', 'Your notification settings have been changed.');
                    dlg.result.then(function () {
                        $state.reload();
                    })
                } else {
                    dialogs.error('Update failed.', data.Message);
                }
            });
        };

        $scope.Init();
    }
})();