(function () {
    'use strict';

    angular
    .module('app')
    .controller('NotificationsController', NotificationsController);

    NotificationsController.$inject = ['$scope', '$stateParams', 'localStorageService', 'apiConfig', 'dataService', '$http', '$filter', 'configService', '$state', 'dialogs'];

    function NotificationsController($scope, $stateParams, localStorageService, apiConfig, dataService, $http, $filter, configService, $state, dialogs) {

        $scope.notifyOptions = { onNotificationMethodChanged: function () { $scope.NotificationMethodChanged(); } };
        $scope.Customer = { Notifications: [], loaded: false, NotificationSaveMode: 2 };
        $scope.Settings = configService.getProfile();
        $scope.Settings.Notifications = $filter('orderBy')($scope.Settings.Notifications, ['Description', 'MethodName'], false);

        $scope.Init = function () {
            if ($stateParams.Id) {
                dataService.customer.getCustomerNotificationsById($stateParams.Id).then(function (data) {
                    //console.log('get customer notifications');
                    //console.log(data);

                    if (!data.Failed) {
                        $scope.Customer.ClientAccountID = $stateParams.Id;
                        $scope.Customer.Notifications = data.ReturnObject.Notifications;
                        $scope.Customer.Notifications = $filter('orderBy')($scope.Customer.Notifications, 'NotificationTypeDescription', false);

                        $scope.Customer.EmailAddress = data.ReturnObject.EmailAddress;
                        $scope.Customer.EmailAddress2 = "";
                        $scope.Customer.EmailAddress3 = "";
                        $scope.Customer.EmailAddress4 = "";
                        $scope.Customer.Phones = [];

                        $scope.Customer.loaded = true;

                    } else {
                        console.log("getCustomerNotificationsById failed");
                        //console.log($scope.Customer.Notifications.length);
                    }
                });
            }
        };

        // Undo Form
        $scope.UndoChanges = function () {
            $state.reload();
        };

        $scope.SaveNotification = function () {

            var p = $scope.SaveNotificationInternal();

            p.then(function (data) {
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
                $scope.notifyOptions.disableAll();

                $scope.SaveNotification();

            }).catch(function () { });
        };

        $scope.NotificationMethodChanged = function () {
            var p = $scope.SaveNotificationInternal();

            p.then(function (data) {
                if (!data.Failed) {
                    //console.log('$scope.NotificationMethodChanged succeed');
                } else {
                    console.log('$scope.NotificationMethodChanged failed');
                }
            });
        }


        $scope.Init();
    }
})();